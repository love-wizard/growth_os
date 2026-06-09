const apiBaseUrl = "http://growth.familylove.space";

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

export function getJson(path: string) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method: "GET",
      header: {
        "content-type": "application/json"
      },
      success: resolve,
      fail: reject
    });
  });
}
