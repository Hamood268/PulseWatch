function generateID(count) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < count; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

module.exports = { generateID };