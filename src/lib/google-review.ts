/**
 * Google Business Profile for TransPool24 (Maps + Knowledge Panel).
 * FID/CID from Maps: 0x6fac62ba23847995:0xd1882fac4a554a58 → decimal 15098370167787571800
 * Knowledge Graph: /g/11nb6ly68_
 *
 * Do not use `#lrd=…` in emails: Gmail/iOS Mail strip URL fragments, so phones
 * land on a generic Google search with ads instead of the review form.
 * `maps.google.com/?cid=` opens the exact listing on phone and desktop.
 */
export const GOOGLE_MAPS_CID = "15098370167787571800";

export const GOOGLE_WRITE_REVIEW_URL =
  `https://maps.google.com/?cid=${GOOGLE_MAPS_CID}&hl=de`;
