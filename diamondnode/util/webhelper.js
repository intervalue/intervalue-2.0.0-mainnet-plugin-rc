"use strict";

let sa = require("superagent");
// let request = require("request");
let timeout = 10 * 1000;

class WebHelper {
    static httpGet(url, headers, cb) {
        return new Promise(function (resolve, reject) {
            sa
                .get(url)
                .set(headers == null ? {} : headers)
                .timeout(timeout)
                .end(function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // console.log(JSON.stringify(res.text));
                    if (cb != null) {
                        cb(err, res.text);
                    }
                    resolve(res.text);
                });
        });
    }


    static httpPost(url, headers, data, cb) {
        return new Promise(function (resolve, reject) {
            sa
                .post(url)
                .type('form')
                .set(headers == null ? {} : headers)
                .send(data)
                .timeout(timeout)
                .end(function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (cb != null) {
                        cb(err, res.text);
                    }
                    resolve(res.text);
                });
        });
    }
}

module.exports = WebHelper;
