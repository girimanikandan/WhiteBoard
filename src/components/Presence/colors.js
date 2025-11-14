// src/components/Presence/colors.js
export const cursorColors = [
  "#ff4757",
  "#3742fa", 
  "#2ed573",
  "#ffa502",
  "#1e90ff",
  "#ff6b81",
  "#7bed9f",
  "#5352ed",
  "#ff6348",
  "#70a1ff"
];

export function getColorForUser(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cursorColors[Math.abs(hash) % cursorColors.length];
}