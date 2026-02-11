import { NextResponse } from "next/server";
import products from "@/data/products.json";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const transcript = (text || "").trim().toLowerCase();

    if (!transcript) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });

    // --- 1. สกัดตัวเลขราคาให้แม่นยำขึ้น (รองรับคำว่า "พัน" เป็นเลข 1000) ---
    let processedTranscript = transcript.replace(/พัน/g, "000").replace(/,/g, "");
    const numbers = processedTranscript.match(/\d+/g);
    const limitPrice = numbers ? Math.max(...numbers.map(Number)) : null;

    // เช็คว่าเป็นการถามเรื่องราคาหรือไม่
    const isPriceSearch = transcript.includes("ราคา") || transcript.includes("ไม่เกิน") || transcript.includes("งบ");

    // --- 2. ทำความสะอาด Keyword (เน้นตัดคำที่ไม่ใช่ชื่อสินค้าออก) ---
    let cleanKeyword = processedTranscript
      .replace(/ราคา|ไม่เกิน|บาท|เท่าไหร่|มี|ไหม|ขอ|อยากได้|ขอดู|งบ|ประมาณ|ในระบบ|ข้อมูล|อะไรบ้าง|ตัว/g, "")
      .replace(/\d+/g, "")
      .trim();

    // --- 3. ตรวจสอบการถามภาพรวมระบบ (General Inquiry) ---
    const helpKeywords = ["มีอะไรบ้าง", "ขายอะไรบ้าง", "มีหมวดหมู่ไหน", "ข้อมูลอะไรบ้าง"];
    const isGeneral = helpKeywords.some(k => transcript.includes(k)) && cleanKeyword === "";

    if (isGeneral) {
      const categories = Array.from(new Set(products.map(p => p.category)));
      return NextResponse.json({
        answer: `ในระบบมีสินค้าครอบคลุมหมวดหมู่ ${categories.join(", ")} ครับ สนใจตัวไหนสอบถามได้เลย`,
        items: products.slice(0, 5),
        transcript: text
      });
    }

    // --- 4. Logic การกรองสินค้าจากฐานข้อมูลจริง (Strict Filtering) ---
    let matchedProducts = products.filter(p => {
      const name = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const tags = p.tags.map(t => t.toLowerCase());

      const isMatch = cleanKeyword === "" ||
        name.includes(cleanKeyword) ||
        cat.includes(cleanKeyword) ||
        tags.some(t => t.includes(cleanKeyword));

      if (isPriceSearch && limitPrice !== null) {
        return isMatch && p.price <= limitPrice;
      }
      return isMatch;
    });

    // --- 5. การจัดการ Response ให้แม่นยำตามคำพูด ---
    if (matchedProducts.length > 0) {
      matchedProducts.sort((a, b) => a.price - b.price); // เรียงถูกไปแพง

      let responseAnswer = `พบสินค้าเกี่ยวกับ "${cleanKeyword || 'ที่คุณต้องการ'}" ดังนี้ครับ:`;
      if (limitPrice !== null && isPriceSearch) {
        responseAnswer = `นี่คือสินค้า "${cleanKeyword || 'ทั้งหมด'}" ในราคาไม่เกิน ${limitPrice.toLocaleString()} บาท ที่พบครับ:`;
      }

      return NextResponse.json({
        answer: responseAnswer,
        items: matchedProducts,
        transcript: text
      });
    } else {
      return NextResponse.json({
        answer: limitPrice && isPriceSearch
          ? `ขออภัยครับ ไม่พบ "${cleanKeyword}" ที่ราคาไม่เกิน ${limitPrice.toLocaleString()} บาท ในระบบครับ`
          : `ขออภัยครับ ไม่พบข้อมูลสำหรับ "${cleanKeyword || text}" ในระบบตอนนี้ครับ`,
        items: products.slice(0, 3),
        transcript: text,
        notFound: true
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
