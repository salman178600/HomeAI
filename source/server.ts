import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { defaultBusinessProfile } from "./src/data/businessData.js";
import { CustomerLead, ChatResponsePayload, BusinessProfile } from "./src/types.js";
import {
  extractSinglePhoneNumber,
  normalizePhoneNumber,
  mergePhoneNumber,
  isValidSinglePhoneNumber,
  getPhoneCore,
} from "./src/utils/phoneUtils.js";

const PORT = 3000;
const app = express();

app.use(express.json());

// Health check endpoints for deployment rollout & container probes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function cleanLeadString(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = String(val).trim().replace(/^[:,"'\s]+|[:,"'\s]+$/g, "");
  if (
    !trimmed ||
    !/[a-zA-Z0-9]/.test(trimmed) ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "n/a" ||
    trimmed.toLowerCase() === "unknown"
  ) {
    return null;
  }
  return trimmed;
}

// In-memory leads storage
let leads: CustomerLead[] = [];

// In-memory business profile with customizable placeholders
let currentBusinessProfile: BusinessProfile = { ...defaultBusinessProfile };

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_") || apiKey.trim().length < 15) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function detectHomeServiceCategory(text: string): string | null {
  const lower = text.toLowerCase();
  if (/plumb|tap|pipe|water|drain|leak|flush|basin|sanitary|tank|blockage|geyser pipe|cistern/i.test(lower)) {
    return "Plumber";
  }
  if (/chandelier|fan|light|wiring|wire|switch|socket|mcb|fuse|electric|short circuit|inverter|bulb|panel/i.test(lower)) {
    return "Electrician";
  }
  if (/paint|wall|colour|color|putty|primer|whitewash|texture|distemper|waterproof/i.test(lower)) {
    return "Painter";
  }
  if (/carpent|wood|furniture|door|lock|table|chair|bed|wardrobe|cabinet|cupboard|hinge|handle|sofa/i.test(lower)) {
    return "Carpenter";
  }
  if (/\bac\b|air condition|cooling|compressor|gas refill|split ac|window ac|duct/i.test(lower)) {
    return "AC Service";
  }
  if (/appliance|washing machine|geyser|refrigerator|fridge|microwave|oven|chimney|ro purifier|water purifier/i.test(lower)) {
    return "Appliance Repair";
  }
  if (/maintenance|handyman|repair|fitting|install/i.test(lower)) {
    return "Home Maintenance";
  }
  return null;
}

// Fallback intelligent agent if API key is not supplied or fails
function fallbackBusinessAgent(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  profile: BusinessProfile = currentBusinessProfile,
  currentLead?: Partial<CustomerLead> | null
): ChatResponsePayload {
  const lower = userMessage.toLowerCase();
  const isHindiOrUrdu = /(?:mujhe|aapki|aapka|aapke|batao|bataiye|kya|hai|hain|ke baare|kitna|kitne|mera|meri|namaste|salam|shukriya|dhanyawad|daam|keemat|kripya|time|samay|waqt|bhaiya|chahiye|karo|karna|karwana|bhejo|tut|toot|lagwana|theek)/i.test(userMessage);

  // Extract phone number strictly once (valid 10-digit mobile or +91 formatted)
  const newlyDetectedPhone = extractSinglePhoneNumber(userMessage);

  // Determine existing known details from session
  const existingPhone = currentLead?.phone ? normalizePhoneNumber(currentLead.phone) : null;
  const existingName = cleanLeadString(currentLead?.name);
  const existingReq = cleanLeadString(currentLead?.requirement);

  // Merge phone safely - never duplicate, never concatenate
  const effectivePhone = mergePhoneNumber(existingPhone, newlyDetectedPhone);

  // Extract name if pattern like "my name is X", "I am X", "I'm X", "name: X", "mera naam X hai"
  let detectedName: string | null = null;
  const nameMatch = userMessage.match(/(?:my name is|i am|i'm|call me|name\s*[:=-]|mera naam|naam)\s+([a-zA-Z]{2,20}(?:\s+[a-zA-Z]{2,20})?)/i);
  if (nameMatch && nameMatch[1]) {
    let rawName = nameMatch[1].trim();
    rawName = rawName.replace(/\s+(?:hai|hoon|here|and|aur|ji|bol raha|bol rahi)$/i, "").trim();
    if (rawName.length >= 2) {
      detectedName = rawName;
    }
  }
  const effectiveName = detectedName || existingName;

  // Detect service category
  const detectedCategory = detectHomeServiceCategory(userMessage);

  // Extract requirement
  let detectedReq: string | null = null;
  const reqMatch = userMessage.match(/(?:need|want|looking for|require|requirement\s*[:=-]|chahiye|zaroorat|madad|problem|issue|repair|fitting|installation|servicing)\s+([^.!?]+)/i);
  if (reqMatch && reqMatch[1]) {
    detectedReq = reqMatch[1].trim();
  } else if (detectedCategory) {
    detectedReq = `${detectedCategory} work`;
    if (/tap|pipe|leak/i.test(lower)) detectedReq = "Water tap / pipe repair";
    else if (/fan/i.test(lower)) detectedReq = "Fan installation / repair";
    else if (/chandelier/i.test(lower)) detectedReq = "Chandelier fitting / repair";
    else if (/switch|socket/i.test(lower)) detectedReq = "Switch / socket repair";
    else if (/wiring/i.test(lower)) detectedReq = "Wiring work";
    else if (/ac|cooling/i.test(lower)) detectedReq = "AC installation / repair / servicing";
    else if (/door|lock/i.test(lower)) detectedReq = "Door / lock repair";
    else if (/furniture/i.test(lower)) detectedReq = "Furniture repair / installation";
    else if (/paint/i.test(lower)) detectedReq = "Painting work";
  }
  const effectiveReq = detectedReq || existingReq;

  // Extract preferred time if mentioned
  let detectedTime: string | null = null;
  const timeKeywords = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "somwar", "mangalwar", "budhwar", "guruwar", "shukrawar", "shaniwar", "ravivar",
    "tomorrow", "kal", "next week", "agle hafte", "morning", "subah",
    "afternoon", "dopahar", "evening", "shaam", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"
  ];
  for (const kw of timeKeywords) {
    if (lower.includes(kw)) {
      detectedTime = kw.charAt(0).toUpperCase() + kw.slice(1);
      break;
    }
  }

  const isAppointmentRequest =
    lower.includes("appointment") ||
    lower.includes("book") ||
    lower.includes("schedule") ||
    lower.includes("consultation") ||
    lower.includes("visit") ||
    lower.includes("inspection") ||
    lower.includes("bhejo") ||
    lower.includes("bhejna") ||
    lower.includes("kab aa sakte") ||
    lower.includes("technician");

  let reply = "";

  if (isHindiOrUrdu) {
    // Hinglish / Roman Hindi responses
    if (isAppointmentRequest) {
      if (effectiveName && effectivePhone) {
        reply = `Shukriya ${effectiveName}! Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye ${effectivePhone} par aapse contact karegi (status: Pending Confirmation).`;
      } else if (effectiveName && !effectivePhone) {
        reply = `Shukriya ${effectiveName}! Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi. Kripya apna phone number share kar dijiye.`;
      } else if (!effectiveName && effectivePhone) {
        reply = `Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye ${effectivePhone} par contact karegi (status: Pending Confirmation). Kripya apna naam bhi batayein.`;
      } else {
        reply = `Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi (status: Pending Confirmation). Kripya apna naam, phone number aur requirement batayein.`;
      }
    } else if (lower.includes("price") || lower.includes("pricing") || lower.includes("cost") || lower.includes("daam") || lower.includes("keemat") || lower.includes("kitna") || lower.includes("rate") || lower.includes("charge")) {
      if (profile.prices && profile.prices.trim()) {
        reply = `Humari pricing: ${profile.prices.trim()}. Exact quotation ke liye kripya apna naam, phone number aur work requirement share karein.`;
      } else {
        reply = "Kaam aur visiting charges exact work requirement aur on-site inspection par depend karte hain. Kripya apna naam, phone number aur exact work requirement batayein taaki team aapse contact kare.";
      }
    } else if (lower.includes("service") || lower.includes("services") || lower.includes("offer") || lower.includes("kya karte") || lower.includes("kya kya")) {
      if (profile.services && profile.services.trim()) {
        reply = `Hum provide karte hain: Plumber, Electrician, Painter, Carpenter, AC repair/servicing, Chandelier/Fan/Light fitting, Wiring, Door/Lock repair, aur home maintenance. Kripya apna naam, phone number aur requirement batayein.`;
      } else {
        reply = "Hum plumbing, electrical, carpentry, painting, AC servicing aur home maintenance services provide karte hain. Kripya apna naam, phone number aur work requirement share karein.";
      }
    } else if (lower.includes("timing") || lower.includes("time") || lower.includes("waqt") || lower.includes("samay") || lower.includes("open") || lower.includes("khula") || lower.includes("hours") || lower.includes("kab") || lower.includes("available")) {
      if (profile.timings && profile.timings.trim()) {
        reply = `${profile.timings.trim()} Kripya apna naam, phone number aur preferred waqt batayein.`;
      } else {
        reply = "Service visit timings technician availability aur customer requirements par depend karti hain. Humari team aapse contact karke visit timing confirm karegi. Kripya apna naam, phone number aur preferred waqt batayein.";
      }
    } else if (lower.includes("location") || lower.includes("address") || lower.includes("kahan") || lower.includes("area")) {
      if (profile.location && profile.location.trim()) {
        reply = `Humara service area: ${profile.location.trim()}. Doorstep service ke liye apna naam, phone number aur address/requirement batayein.`;
      } else {
        reply = "Hum doorstep home services provide karte hain. Details aur technician visit ke liye kripya apna area/location, naam aur phone number share karein.";
      }
    } else if (lower.includes("contact") || lower.includes("phone") || lower.includes("number") || lower.includes("rabta")) {
      if (profile.contactDetails && profile.contactDetails.trim()) {
        reply = `Aap humein contact kar sakte hain: ${profile.contactDetails.trim()}. Aap apna naam aur phone number bhi yahan share kar sakte hain.`;
      } else {
        reply = "Humari team aapse direct contact karegi. Kripya apna naam, phone number aur requirement share kar dijiye.";
      }
    } else if (detectedCategory || effectiveReq) {
      const parts: string[] = [];
      if (!effectiveName) parts.push("naam");
      if (!effectivePhone) parts.push("phone number");
      if (!effectiveReq) parts.push("work details");

      const categoryNotice = detectedCategory ? `Ji zaroor, hum ${detectedCategory} services provide karte hain. ` : "";
      if (parts.length > 0) {
        reply = `${categoryNotice}Kripya apna ${parts.join(" aur ")} share kar dijiye taaki humari team aapse contact karke visit schedule kar sake.`;
      } else {
        reply = `Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi. Shukriya ${effectiveName || ""}!`;
      }
    } else if (effectiveName || effectivePhone) {
      const parts: string[] = [];
      if (!effectiveName) parts.push("naam");
      if (!effectivePhone) parts.push("phone number");
      if (!effectiveReq) parts.push("work requirement (e.g. plumber, electrician, AC, carpenter, painting)");

      if (parts.length > 0) {
        const greeting = effectiveName ? `Shukriya ${effectiveName}! ` : "Shukriya! ";
        reply = `${greeting}Kripya apna ${parts.join(" aur ")} share kar dijiye.`;
      } else {
        reply = `Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi. Shukriya ${effectiveName || ""}!`;
      }
    } else {
      reply = `Hello 👋! ${profile.name} mein aapka swagat hai. Hum Plumber, Electrician, Painter, Carpenter, AC, aur home maintenance provide karte hain. Kripya apna naam, phone number aur requirement share karein.`;
    }
  } else {
    // English responses
    if (isAppointmentRequest) {
      if (effectiveName && effectivePhone) {
        reply = `Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit (recorded as Pending Confirmation). Thank you ${effectiveName}!`;
      } else if (effectiveName && !effectivePhone) {
        reply = `Thank you ${effectiveName}! Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit, so please share your phone number.`;
      } else if (!effectiveName && effectivePhone) {
        reply = `Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit (recorded as Pending Confirmation). Could you also share your name and work requirement?`;
      } else {
        reply = `Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit (recorded as Pending Confirmation). Please share your name, phone number, and preferred timing.`;
      }
    } else if (lower.includes("price") || lower.includes("pricing") || lower.includes("cost") || lower.includes("how much") || lower.includes("rates") || lower.includes("charge") || lower.includes("fee")) {
      if (profile.prices && profile.prices.trim()) {
        reply = `Our pricing: ${profile.prices.trim()}. For an exact quote, please share your specific work requirement, name, and phone number.`;
      } else {
        reply = "Pricing and visit charges depend on the specific work requirement and on-site inspection. Could you please share your name, phone number, and exact issue so our team can provide a tailored quote?";
      }
    } else if (lower.includes("service") || lower.includes("what do you do") || lower.includes("offer") || lower.includes("package")) {
      if (profile.services && profile.services.trim()) {
        reply = `We provide: Plumber, Electrician, Painter, Carpenter, AC repair/servicing, Chandelier/Fan/Light fitting, Wiring, Door/Lock repair, and home maintenance. Please share your name, phone number, and requirement so our team can assist.`;
      } else {
        reply = "We offer all-in-one home services including Plumber, Electrician, Painter, Carpenter, AC servicing, and appliance repairs. Please share your name, phone number, and requirement.";
      }
    } else if (lower.includes("timing") || lower.includes("time") || lower.includes("hour") || lower.includes("open") || lower.includes("when are you") || lower.includes("when can") || lower.includes("available")) {
      if (profile.timings && profile.timings.trim()) {
        reply = `${profile.timings.trim()} Please share your name, phone number, and preferred time.`;
      } else {
        reply = "Service visit timings depend on technician availability and customer requirements. Our team will confirm the visit timing with the customer. Could you share your preferred day/time along with your name and phone number?";
      }
    } else if (lower.includes("location") || lower.includes("address") || lower.includes("where are you") || lower.includes("area")) {
      if (profile.location && profile.location.trim()) {
        reply = `Our service location: ${profile.location.trim()}. For doorstep service, please share your area, name, and phone number.`;
      } else {
        reply = "We provide doorstep home maintenance services. Please share your area/address along with your name and phone number so our team can assist.";
      }
    } else if (lower.includes("contact") || lower.includes("phone") || lower.includes("email") || lower.includes("reach")) {
      if (profile.contactDetails && profile.contactDetails.trim()) {
        reply = `You can reach us at: ${profile.contactDetails.trim()}. You can also share your name and phone number here so our team can follow up.`;
      } else {
        reply = "Our team will reach out directly to you. Please share your name, phone number, and work requirement so we can connect.";
      }
    } else if (detectedCategory || effectiveReq) {
      const parts: string[] = [];
      if (!effectiveName) parts.push("name");
      if (!effectivePhone) parts.push("phone number");
      if (!effectiveReq) parts.push("work details");

      const categoryNotice = detectedCategory ? `Yes, we provide ${detectedCategory} services! ` : "";
      if (parts.length > 0) {
        reply = `${categoryNotice}Could you please provide your ${parts.join(" and ")} so our team can assist you?`;
      } else {
        reply = `Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit. Thank you ${effectiveName || ""}!`;
      }
    } else if (effectiveName || effectivePhone) {
      const parts: string[] = [];
      if (!effectiveName) parts.push("name");
      if (!effectivePhone) parts.push("phone number");
      if (!effectiveReq) parts.push("work requirement (e.g. plumber, electrician, AC, carpenter, painter)");

      if (parts.length > 0) {
        const greeting = effectiveName ? `Thanks ${effectiveName}! ` : "Thank you! ";
        reply = `${greeting}Could you also provide your ${parts.join(" and ")} so our team can follow up?`;
      } else {
        reply = `Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit. Thank you ${effectiveName || ""}!`;
      }
    } else {
      reply = `Hello 👋! Welcome to ${profile.name}. We provide Plumber, Electrician, Painter, Carpenter, AC, and appliance services. Please share your name, phone number, and work requirement so our team can assist you.`;
    }
  }

  return {
    reply,
    extractedLead: {
      name: effectiveName,
      phone: effectivePhone,
      requirement: effectiveReq,
      serviceCategory: detectedCategory || (effectiveReq ? detectHomeServiceCategory(effectiveReq) : undefined),
      preferredTime: detectedTime || currentLead?.preferredTime || undefined,
    },
    isAppointmentRequest,
  };
}

// API Routes
app.get("/api/business-info", (req, res) => {
  res.json(currentBusinessProfile);
});

app.put("/api/business-info", (req, res) => {
  const { name, services, prices, timings, location, contactDetails } = req.body;
  if (name !== undefined) currentBusinessProfile.name = String(name).trim() || "All-in-One Home Services";
  if (services !== undefined) currentBusinessProfile.services = String(services).trim();
  if (prices !== undefined) currentBusinessProfile.prices = String(prices).trim();
  if (timings !== undefined) currentBusinessProfile.timings = String(timings).trim();
  if (location !== undefined) currentBusinessProfile.location = String(location).trim();
  if (contactDetails !== undefined) currentBusinessProfile.contactDetails = String(contactDetails).trim();

  res.json(currentBusinessProfile);
});

app.post("/api/business-info/reset", (req, res) => {
  currentBusinessProfile = { ...defaultBusinessProfile };
  res.json(currentBusinessProfile);
});

app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const { name, phone, requirement, serviceCategory, preferredTime, lastMessage } = req.body;
  if (!name && !phone && !requirement) {
    res.status(400).json({ error: "At least one lead field is required" });
    return;
  }

  // Extract only the actual single phone number and validate
  const singlePhone = extractSinglePhoneNumber(phone);
  const validPhone = singlePhone && isValidSinglePhoneNumber(singlePhone) ? singlePhone : singlePhone || null;

  const detectedCat = serviceCategory || (requirement ? detectHomeServiceCategory(requirement) : null) || (lastMessage ? detectHomeServiceCategory(lastMessage) : null);

  // Check if lead with same phone or name already exists to update it without duplication
  const phoneCore = validPhone ? getPhoneCore(validPhone) : null;
  const existingIndex = leads.findIndex(
    (l) =>
      (phoneCore && l.phone && getPhoneCore(l.phone) === phoneCore) ||
      (name && l.name && cleanLeadString(l.name)?.toLowerCase() === cleanLeadString(name)?.toLowerCase())
  );

  if (existingIndex >= 0) {
    leads[existingIndex] = {
      ...leads[existingIndex],
      name: cleanLeadString(name) || leads[existingIndex].name,
      // Store single phone number exactly once; never concatenate or append
      phone: validPhone || leads[existingIndex].phone,
      requirement: cleanLeadString(requirement) || leads[existingIndex].requirement,
      serviceCategory: detectedCat || leads[existingIndex].serviceCategory,
      preferredTime: cleanLeadString(preferredTime) || leads[existingIndex].preferredTime,
      lastMessage: lastMessage || leads[existingIndex].lastMessage,
    };
    res.json(leads[existingIndex]);
    return;
  }

  const newLead: CustomerLead = {
    id: `lead-${Date.now()}`,
    name: cleanLeadString(name) || undefined,
    phone: validPhone || undefined,
    requirement: cleanLeadString(requirement) || undefined,
    serviceCategory: detectedCat || undefined,
    preferredTime: cleanLeadString(preferredTime) || undefined,
    status: "new",
    capturedAt: new Date().toISOString(),
    source: "chat",
    lastMessage: lastMessage || undefined,
  };

  leads.unshift(newLead);
  res.json(newLead);
});

app.patch("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const { status, requirement, serviceCategory, preferredTime } = req.body;
  const lead = leads.find((l) => l.id === id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (status) lead.status = status;
  if (requirement !== undefined) lead.requirement = requirement;
  if (serviceCategory !== undefined) lead.serviceCategory = serviceCategory;
  if (preferredTime !== undefined) lead.preferredTime = preferredTime;
  res.json(lead);
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userMessage, currentLead } = req.body;
    if (!userMessage) {
      res.status(400).json({ error: "userMessage is required" });
      return;
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback mode without API key
      const fallbackResult = fallbackBusinessAgent(
        userMessage,
        messages || [],
        currentBusinessProfile,
        currentLead
      );
      const mergedPhone = mergePhoneNumber(
        currentLead?.phone,
        fallbackResult.extractedLead?.phone
      );
      const mergedName = cleanLeadString(fallbackResult.extractedLead?.name) || cleanLeadString(currentLead?.name) || null;
      const mergedReq = cleanLeadString(fallbackResult.extractedLead?.requirement) || cleanLeadString(currentLead?.requirement) || null;
      const detectedCat =
        cleanLeadString(fallbackResult.extractedLead?.serviceCategory) ||
        cleanLeadString(currentLead?.serviceCategory) ||
        (mergedReq ? detectHomeServiceCategory(mergedReq) : null) ||
        detectHomeServiceCategory(userMessage) ||
        null;
      const mergedTime = cleanLeadString(fallbackResult.extractedLead?.preferredTime) || cleanLeadString(currentLead?.preferredTime) || null;

      // If we found any lead details, save/merge into leads
      if (mergedName || mergedPhone || mergedReq) {
        saveOrUpdateLead({
          name: mergedName,
          phone: mergedPhone,
          requirement: mergedReq,
          serviceCategory: detectedCat,
          preferredTime: mergedTime,
          lastMessage: userMessage,
        });
      }
      res.json({
        ...fallbackResult,
        extractedLead: {
          name: mergedName,
          phone: mergedPhone,
          requirement: mergedReq,
          serviceCategory: detectedCat || undefined,
          preferredTime: mergedTime,
        },
      });
      return;
    }

    // Build system instructions with zero-invention directives
    const profile = currentBusinessProfile;

    const servicesInfo = profile.services?.trim() ? profile.services.trim() : "Not provided. If asked, state that home services depend on their specific work requirement, and ask what they need assistance with.";
    const pricesInfo = profile.prices?.trim() ? profile.prices.trim() : "Not provided. If asked, state that pricing depends on the specific work requirement and on-site evaluation, and invite them to share their requirement with name and phone number.";
    const timingsInfo = profile.timings?.trim() ? profile.timings.trim() : "Service visit timings depend on technician availability and customer requirements. Team will confirm the visit timing with the customer.";
    const locationInfo = profile.location?.trim() ? profile.location.trim() : "Not provided. If asked, state that our technicians provide doorstep assistance and our team will connect directly.";
    const contactInfo = profile.contactDetails?.trim() ? profile.contactDetails.trim() : "Not provided. If asked, invite them to share their contact number and name so our team can follow up directly.";

    const systemInstruction = `
You are the official All-in-One Home Services AI Lead Collector for "${profile.name}".

[CONFIGURED BUSINESS INFORMATION]
- Business Name: ${profile.name}
- Configured Services: ${servicesInfo}
- Prices: ${pricesInfo}
- Timings & Visit Policy: ${timingsInfo}
- Location & Service Area: ${locationInfo}
- Contact Details: ${contactInfo}

SUPPORTED HOME SERVICE DISCIPLINES:
You support all home maintenance disciplines including:
- Plumber: Water tap/pipe repair, leakages, sanitary fittings, drain blockage, flush, sink, water tank.
- Electrician: Wiring, Switch/Socket repair, Fan installation/repair, Light installation/repair, Chandelier fitting/repair, MCB/fuse, short circuit.
- Painter: Interior and exterior painting, wall touch-ups, putty/primer, waterproofing.
- Carpenter: Furniture repair/installation, Door/Lock repair, cupboards, wardrobes, hinges.
- AC Services: AC installation, AC repair, AC servicing, cooling issues, gas refill.
- Chandelier fitting/repair.
- Fan installation/repair.
- Light installation/repair.
- Wiring & Switch/Socket repair.
- Water tap/pipe repair.
- Furniture repair/installation.
- Door/Lock repair.
- Appliance installation/repair: Geyser, washing machine, refrigerator, microwave, chimney, water purifier.
- Other home maintenance and repair services.

CRITICAL OPERATING DIRECTIVES & CONSTRAINTS:
1. STRICT ZERO-INVENTION DIRECTIVE (USE ONLY CONFIGURED BUSINESS INFORMATION):
   - You MUST ONLY use information explicitly provided in the [CONFIGURED BUSINESS INFORMATION] fields above.
   - You MUST NEVER invent, assume, or fabricate ANY prices, rates, visiting fees, diagnostic charges, timings, open hours, locations, service areas, phone numbers, or immediate technician availability.
   - If a field is not provided:
     * Prices: State that pricing and quotation depend on the specific work requirement and on-site inspection (in English: "Pricing and visiting charges depend on the specific work requirement and on-site inspection" / in Hinglish: "Charges aur quotation exact work requirement aur on-site inspection par depend karti hai").
     * Timings/Availability: Explicitly state that service visit timings depend on technician availability and customer requirements, and the team will confirm the visit timing with the customer.
     * Location/Contact: State that our team provides doorstep assistance and will contact the customer directly.
   - Then invite the customer to share their Work Requirement along with their Name and Phone Number so the team can provide accurate assistance.

2. SERVICE REQUEST WORDING & ZERO-GUARANTEE DIRECTIVE (MANDATORY):
   - The AI must NEVER promise or guarantee that a service will be completed or that a technician will definitely visit before the team confirms availability.
   - NEVER say: "We will get the work done at your home", "We will do the work", "Hum aapke ghar kaam kar denge", or make any unconditional promise that a technician will visit or that work will be completed.
   - INSTEAD of saying: "We will get the work done at your home", you MUST SAY:
     * English: "Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit."
     * Hinglish: "Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi."
   - Service visit timings depend on technician availability and customer requirements.
   - The team will confirm the visit timing with the customer.
   - No automated booking system or calendar integration is connected.
   - All appointment and technician visit requests ALWAYS remain "Pending Confirmation" until the team confirms them, and must NEVER be falsely or prematurely confirmed by you.
   - If the customer requests a technician visit or shares a preferred time, acknowledge clearly using the required wording:
     "Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit (recorded as Pending Confirmation)."
     (Hinglish: "Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi (status: Pending Confirmation).")
   - NEVER say "Your slot is booked", "Your visit is confirmed", "Appointment confirmed", or "Booking successful".

3. LANGUAGE SUPPORT (ENGLISH & NATURAL HINGLISH):
   - Support English and natural, polite Hinglish (Roman Hindi/Urdu, e.g., "tap leak ho raha hai bhaiya", "AC service karwana hai", "chandelier aur fan fitting karni hai").
   - Match the customer's language style: reply in polite Hinglish if they write in Hinglish or Hindi; reply in professional English if they write in English.

4. LEAD COLLECTION & STRICT PHONE NUMBER RULES (MANDATORY):
   - For every customer, understand their home service requirement and collect:
     1. Name
     2. Phone Number
     3. Work Requirement (specific problem or repair needed)
   - PHONE NUMBER RULES:
     * If [CURRENT KNOWN CUSTOMER DATA] already has a Phone number, DO NOT ask the customer for their phone number again under any circumstance. Only ask for remaining missing details (Name or Work Requirement).
     * When a customer provides a phone number: extract ONLY the actual phone number.
     * Store it EXACTLY ONCE.
     * For Indian numbers, accept valid 10-digit mobile numbers (starting with 6, 7, 8, or 9) and optionally +91 formatted numbers.
     * Normalize the stored value to one valid phone number.
     * If the customer already provided a phone number, do not ask again or append the number a second time.
     * NEVER modify, invent, or duplicate customer phone numbers.
     * NEVER concatenate, comma-separate, or append phone numbers (e.g. NEVER output "9876543210, 9876543210" or "9876543210 / 9876543210").
   - If any of these fields are already known from [CURRENT KNOWN CUSTOMER DATA] or earlier messages, do NOT ask for them again—only ask politely for what is still missing.
   - When all details are provided or when a service request is made, use the required wording:
     * English: "Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit."
     * Hinglish: "Aapka service requirement note kar liya gaya hai. Hamari team technician availability check karegi aur visit confirm karne ke liye aapse contact karegi."

5. BREVITY & TONE:
   - Keep answers between 1 and 3 sentences maximum. Be helpful, clear, and reassuring.

6. STRUCTURED EXTRACTION:
   - Extract customer details (name, phone number, work requirement, serviceCategory, preferred appointment/visit time) into the output schema.
   - Ensure extractedLead.phone contains strictly ONE valid phone number.

7. NEUTRAL, INCLUSIVE GREETING & FAIR SERVICE DIRECTIVE (MANDATORY):
   - Always use a neutral, welcoming greeting such as "Hello 👋" for all customers (e.g. "Hello 👋! Welcome to ${profile.name}..." in English, or "Hello 👋! ${profile.name} mein aapka swagat hai..." in Hinglish).
   - You MUST NEVER assume, inquire about, mention, or discriminate based on any customer's religion, faith, caste, creed, or personal background under any circumstances.
   - Never use religion-specific greetings or assumptions.
   - Provide the exact same professional service, courteous tone, and lead-collection process (Name, Phone Number, Work Requirement) to every customer regardless of religion, language, or background. Treat all customers with equal respect and warmth.

[CURRENT KNOWN CUSTOMER DATA]
- Name: ${cleanLeadString(currentLead?.name) || "Unknown yet"}
- Phone: ${normalizePhoneNumber(currentLead?.phone) || "Unknown yet"}
- Requirement: ${cleanLeadString(currentLead?.requirement) || "Unknown yet"}
`.trim();

    // Prepare contents
    const conversationHistory = (messages || []).map((m: { sender: string; text: string }) => ({
      role: m.sender === "agent" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    conversationHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Model candidates: use fast, available models that do not suffer from 503/429 quota spikes
    const candidateModels = ["gemini-3.6-flash", "gemini-3.1-flash-lite"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI generation timeout on ${modelName}`)), 6000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: conversationHistory,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: "Short, polite, and helpful response to the customer (1 to 3 sentences) in the customer's language.",
                },
                extractedLead: {
                  type: Type.OBJECT,
                  description: "Customer information extracted from the conversation.",
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "Customer full name if provided or previously known, otherwise empty string \"\".",
                    },
                    phone: {
                      type: Type.STRING,
                      description: "Customer single phone number if provided or previously known (e.g. '9876543210' or '+91 9876543210'). Strictly ONE valid phone number, otherwise empty string \"\".",
                    },
                    requirement: {
                      type: Type.STRING,
                      description: "Customer work requirement or service needed if provided, otherwise empty string \"\".",
                    },
                    serviceCategory: {
                      type: Type.STRING,
                      description: "Detected home service category (e.g. Plumber, Electrician, Painter, Carpenter, AC Service, Appliance Repair, Home Maintenance), otherwise empty string \"\".",
                    },
                    preferredTime: {
                      type: Type.STRING,
                      description: "Preferred appointment date, day, or visit time if mentioned, otherwise empty string \"\".",
                    },
                  },
                },
                isAppointmentRequest: {
                  type: Type.BOOLEAN,
                  description: "True if the customer is requesting or scheduling a technician visit or appointment.",
                },
              },
              required: ["reply"],
            },
          },
        });

        response = await Promise.race([generatePromise, timeoutPromise]);
        if (response && response.text) {
          break; // Success!
        }
      } catch (err: any) {
        lastError = err;
        // Continue to next candidate model
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All AI models unavailable");
    }

    const rawText = response.text || "{}";
    let parsed: ChatResponsePayload;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        reply: rawText.replace(/```json/g, "").replace(/```/g, "").trim(),
        extractedLead: {},
        isAppointmentRequest: false,
      };
    }

    // Merge with current lead if available - normalize and enforce single phone number
    const aiExtractedPhone = extractSinglePhoneNumber(parsed.extractedLead?.phone);
    const existingPhone = normalizePhoneNumber(currentLead?.phone);
    const mergedPhone = mergePhoneNumber(existingPhone, aiExtractedPhone);

    const mergedName = cleanLeadString(parsed.extractedLead?.name) || cleanLeadString(currentLead?.name) || null;
    const mergedReq = cleanLeadString(parsed.extractedLead?.requirement) || cleanLeadString(currentLead?.requirement) || null;
    const detectedCat =
      cleanLeadString(parsed.extractedLead?.serviceCategory) ||
      cleanLeadString(currentLead?.serviceCategory) ||
      (mergedReq ? detectHomeServiceCategory(mergedReq) : null) ||
      detectHomeServiceCategory(userMessage) ||
      null;
    const mergedTime = cleanLeadString(parsed.extractedLead?.preferredTime) || cleanLeadString(currentLead?.preferredTime) || null;

    if (mergedName || mergedPhone || mergedReq) {
      saveOrUpdateLead({
        name: mergedName,
        phone: mergedPhone,
        requirement: mergedReq,
        serviceCategory: detectedCat,
        preferredTime: mergedTime,
        lastMessage: userMessage,
      });
    }

    res.json({
      reply: parsed.reply,
      extractedLead: {
        name: mergedName,
        phone: mergedPhone,
        requirement: mergedReq,
        serviceCategory: detectedCat || undefined,
        preferredTime: mergedTime,
      },
      isAppointmentRequest: !!parsed.isAppointmentRequest,
    });
  } catch (error: any) {
    // Seamlessly transition to the built-in intelligent fallback agent without writing to stderr
    const currentLead = req.body?.currentLead;
    const fallbackResult = fallbackBusinessAgent(
      req.body?.userMessage || "",
      req.body?.messages || [],
      currentBusinessProfile,
      currentLead
    );
    const mergedPhone = mergePhoneNumber(
      currentLead?.phone,
      fallbackResult.extractedLead?.phone
    );
    const mergedName = cleanLeadString(fallbackResult.extractedLead?.name) || cleanLeadString(currentLead?.name) || null;
    const mergedReq = cleanLeadString(fallbackResult.extractedLead?.requirement) || cleanLeadString(currentLead?.requirement) || null;
    const detectedCat =
      cleanLeadString(fallbackResult.extractedLead?.serviceCategory) ||
      cleanLeadString(currentLead?.serviceCategory) ||
      (mergedReq ? detectHomeServiceCategory(mergedReq) : null) ||
      detectHomeServiceCategory(req.body?.userMessage || "") ||
      null;
    const mergedTime = cleanLeadString(fallbackResult.extractedLead?.preferredTime) || cleanLeadString(currentLead?.preferredTime) || null;

    if (mergedName || mergedPhone || mergedReq) {
      saveOrUpdateLead({
        name: mergedName,
        phone: mergedPhone,
        requirement: mergedReq,
        serviceCategory: detectedCat,
        preferredTime: mergedTime,
        lastMessage: req.body?.userMessage,
      });
    }

    res.json({
      ...fallbackResult,
      extractedLead: {
        name: mergedName,
        phone: mergedPhone,
        requirement: mergedReq,
        serviceCategory: detectedCat || undefined,
        preferredTime: mergedTime,
      },
    });
  }
});

function saveOrUpdateLead(leadData: {
  name?: string | null;
  phone?: string | null;
  requirement?: string | null;
  serviceCategory?: string | null;
  preferredTime?: string | null;
  lastMessage?: string;
}) {
  if (!leadData.name && !leadData.phone && !leadData.requirement) return;

  // Extract only the actual single phone number and validate before saving
  const singlePhone = extractSinglePhoneNumber(leadData.phone);
  const validPhone = singlePhone && isValidSinglePhoneNumber(singlePhone) ? singlePhone : singlePhone || null;

  const detectedCat =
    leadData.serviceCategory ||
    (leadData.requirement ? detectHomeServiceCategory(leadData.requirement) : null) ||
    (leadData.lastMessage ? detectHomeServiceCategory(leadData.lastMessage) : null);

  const phoneCore = validPhone ? getPhoneCore(validPhone) : null;
  const existing = leads.find((l) => {
    if (phoneCore && l.phone && getPhoneCore(l.phone) === phoneCore) return true;
    if (leadData.name && l.name && cleanLeadString(l.name)?.toLowerCase() === cleanLeadString(leadData.name)?.toLowerCase()) return true;
    return false;
  });

  if (existing) {
    if (leadData.name) existing.name = cleanLeadString(leadData.name) || existing.name;
    // Store phone number strictly once; never duplicate, concatenate, or append
    if (validPhone) existing.phone = validPhone;
    if (leadData.requirement) existing.requirement = cleanLeadString(leadData.requirement) || existing.requirement;
    if (detectedCat) existing.serviceCategory = detectedCat;
    if (leadData.preferredTime) existing.preferredTime = cleanLeadString(leadData.preferredTime) || existing.preferredTime;
    if (leadData.lastMessage) existing.lastMessage = leadData.lastMessage;
  } else {
    leads.unshift({
      id: `lead-${Date.now()}`,
      name: cleanLeadString(leadData.name) || undefined,
      phone: validPhone || undefined,
      requirement: cleanLeadString(leadData.requirement) || undefined,
      serviceCategory: detectedCat || undefined,
      preferredTime: cleanLeadString(leadData.preferredTime) || undefined,
      status: "new",
      capturedAt: new Date().toISOString(),
      source: "chat",
      lastMessage: leadData.lastMessage,
    });
  }
}

// Vite middleware for development or static serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Business AI Agent server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
