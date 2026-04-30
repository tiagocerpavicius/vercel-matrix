export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    message: "API funcionando",
    data: [
      { ticker: "GGAL", price: 1200, change: 2.5 },
      { ticker: "YPF", price: 15000, change: -1.2 },
      { ticker: "AL30", price: 35.2, change: 0.8 }
    ]
  });
}
