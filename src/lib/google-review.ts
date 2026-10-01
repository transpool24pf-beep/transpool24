/**
 * Google Business Profile for TransPool24 (Maps + Knowledge Panel).
 * FID/CID: 0x6fac62ba23847995:0xd1882fac4a554a58 → 15098370167787571800
 * Place ID: ChIJlXmEI7pirG8RWEpVSqwviNE
 * Knowledge Graph: /g/11nb6ly68_
 *
 * Email clients strip `#lrd=…` hashes, so phones landed on a generic Google
 * search with ads. `search.google.com/local/writereview?placeid=` is Google's
 * official review form and works on phone and desktop (sign-in, then stars).
 */
export const GOOGLE_MAPS_CID = "15098370167787571800";
export const GOOGLE_PLACE_ID = "ChIJlXmEI7pirG8RWEpVSqwviNE";

export const GOOGLE_WRITE_REVIEW_URL =
  `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;
