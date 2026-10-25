// Firestore limita el tamaño de cada documento. La copia local no se modifica.
export async function fotoParaNube(data) {
  if (
    typeof data !== "string" ||
    !/^data:image\/(jpeg|png|webp|gif|bmp);base64,/.test(data)
  )
    throw Error("La foto no es válida.");
  if (data.length < 850000) return data;
  const img = new Image();
  img.src = data;
  await img.decode();
  const canvas = document.createElement("canvas"),
    factor = Math.min(1, 1280 / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * factor));
  canvas.height = Math.max(1, Math.round(img.height * factor));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (let calidad = 0.85; calidad >= 0.25; calidad -= 0.1) {
    const reducida = canvas.toDataURL("image/jpeg", calidad);
    if (reducida.length < 850000) return reducida;
  }
  throw Error(
    "La foto es demasiado grande para sincronizarla. El original sigue guardado en este dispositivo.",
  );
}
