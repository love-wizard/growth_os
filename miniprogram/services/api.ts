const apiBaseUrl = "https://growth-os.example.com";

export function postJson(path: string, data: unknown) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method: "POST",
      data,
      header: {
        "content-type": "application/json"
      },
      success: resolve,
      fail: reject
    });
  });
}
