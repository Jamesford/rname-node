import kleur from "kleur";

export function clean(str) {
  return str
    .replace(/[\._]/g, " ") // dots and underscores to spaces
    .replace(/[^a-zA-Z\d\s]/, "") // only allow letters digits and spaces
    .trim();
}

export function cleanFilename(str) {
  return str.replace(/[^a-zA-Z\d\.\(\)\-\s\&\,\!\%\']/g, "");
}

export function cleanPath(str) {
  return str.replace(/[^a-zA-Z\d\.\(\)\-\s\&\,\!\%\']/g, "");
}

export function generateRenameTable(renames) {
  // Max length of original file names (ol) and renames (rl)
  const { ol, rl } = renames.reduce(
    ({ ol, rl }, { file, rename }) => ({
      ol: Math.max(file.length, ol),
      rl: Math.max(rename.length, rl),
    }),
    { ol: 0, rl: 0 }
  );

  let table = `┌${"".padEnd(ol + 2, "─")}┬${"".padEnd(rl + 2, "─")}┐\n`;
  table += `│ ${"Original".padEnd(ol, " ")} │ ${"Rename".padEnd(rl, " ")} │\n`;
  table += `├${"".padEnd(ol + 2, "─")}┼${"".padEnd(rl + 2, "─")}┤\n`;
  renames.forEach((row, i) => {
    const c = i % 2 === 0 ? kleur.white : kleur.dim;
    table += `│ ${c(row.file.padEnd(ol, " "))} │ ${c(
      row.rename.padEnd(rl, " ")
    )} │\n`;
  });
  table += `└${"".padEnd(ol + 2, "─")}┴${"".padEnd(rl + 2, "─")}┘\n`;

  return table;
}
