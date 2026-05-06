import { cleanTitle } from '../api/_lib/yt_service.ts';
import dotenv from 'dotenv';
dotenv.config();

const testCases = [
  "LATEST NIGERIAN MOVIE 2024 - CHIEF DADDY EP 1",
  "NEW NOLLYWOOD FILM: THE WEDDING PARTY EP 205",
  "CHIEF DADDY EP. 1",
  "CHIEF DADDY E1",
  "CHIEF DADDY SEASON 1",
  "CHIEF DADDY PART 2",
  "CHIEF DADDY VOL 1",
  "CHIEF DADDY VOLUME 5",
  "LATEST MOVIE 2024 CHIEF DADDY EPISODE 10",
  "HOT TRENDING MOVIE - CHIEF DADDY PART 3"
];

testCases.forEach(tc => {
  console.log(`Original: ${tc}`);
  console.log(`Cleaned:  ${cleanTitle(tc)}`);
  console.log('---');
});
