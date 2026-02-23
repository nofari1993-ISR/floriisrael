// ============================================================
// src/data/flowerImages.ts
// ============================================================
// מיפוי שמות פרחים (כפי שהם מאוחסנים ב-DB) לקבצי תמונה.
// התמונות נמצאות בתיקיית: src/assets/flowers/
// ============================================================

import anemones from "@/assets/flowers/anemones.png";
import babysBreath from "@/assets/flowers/babys-breath.png";
import bayLeaves from "@/assets/flowers/bay-leaves.png";
import carnation from "@/assets/flowers/carnation.png";
import chrysanthemum from "@/assets/flowers/chrysanthemum.png";
import chrysanthemumDecorated from "@/assets/flowers/chrysanthemum-decorated.png";
import eucalyptus from "@/assets/flowers/eucalyptus.png";
import fern from "@/assets/flowers/fern.png";
import freesia from "@/assets/flowers/freesia.png";
import gerbera from "@/assets/flowers/gerbera.png";
import lavender from "@/assets/flowers/lavender.png";
import lily from "@/assets/flowers/lily.png";
import lisianthus from "@/assets/flowers/lisianthus.png";
import orchid from "@/assets/flowers/orchid.png";
import peonies from "@/assets/flowers/peonies.png";
import ranunculus from "@/assets/flowers/ranunculus.png";
import roses from "@/assets/flowers/roses.png";
import ruscus from "@/assets/flowers/ruscus.png";
import sunflower from "@/assets/flowers/sunflower.png";
import tulips from "@/assets/flowers/tulips.png";

// מיפוי שם פרח (עברית) → תמונה
export const FLOWER_IMAGES: Record<string, string> = {
  // ורדים
  "ורד": roses,
  "ורדים": roses,
  "ורדים אדומים": roses,
  "ורדים לבנים": roses,
  "ורדים ורודים": roses,

  // צבעונים
  "צבעוני": tulips,
  "צבעונים": tulips,

  // חמניות
  "חמנייה": sunflower,
  "חמניות": sunflower,

  // גרברות
  "גרברה": gerbera,
  "גרברות": gerbera,

  // פרחי מילוי
  "גיבסנית": babysBreath,
  "לבנדר": lavender,
  "פריזיה": freesia,

  // כריזנטמה
  "כריזנטמה": chrysanthemum,
  "כריזנטמה מקושטת": chrysanthemumDecorated,

  // אנמונה
  "אנמונה": anemones,
  "אנמונות": anemones,

  // ציפורן
  "ציפורן": carnation,
  "ציפורנים": carnation,

  // פרחי יוקרה
  "פיוניה": peonies,
  "פיוניות": peonies,
  "רנונקולוס": ranunculus,
  "ליזיאנטוס": lisianthus,
  "ליליום": lily,
  "סחלב": orchid,

  // ירוקים ועלווה
  "אקליפטוס": eucalyptus,
  "שרך": fern,
  "רוסקוס": ruscus,
  "עלי דפנה": bayLeaves,

  // אחר
  "פרחי בר": gerbera,
  "אירוסים": lavender,
  "לילך": lavender,
};

/**
 * מחזיר את תמונת הפרח לפי שם.
 * אם לא נמצא — מחזיר undefined.
 */
export function getFlowerImage(name: string): string | undefined {
  if (!name) return undefined;
  return FLOWER_IMAGES[name.trim()] ?? undefined;
}
