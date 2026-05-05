import { cleanTitle } from '../api/_lib/yt_service.js';

const titles = [
  "THE REVENGE | FULL NOLLYWOOD MOVIE | EP 1",
  "THE REVENGE | FULL NOLLYWOOD MOVIE | EP 205",
  "BLOOD SISTERS - Nigerian Nollywood Movie EP 10",
  "LATEST NIGERIAN MOVIE 2024 - THE RETURN OF THE KING | EP 1",
  "SOME MOVIE | MWM | EP 5",
  "JUST A NORMAL MOVIE"
];

titles.forEach(t => {
  console.log(`Raw: ${t}`);
  console.log(`Clean: ${cleanTitle(t)}`);
  console.log('---');
});
