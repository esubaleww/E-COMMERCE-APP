import fetch from "node-fetch";
import { ENV } from "./env.js";

const BASE_URL = ENV.UPSTASH_REDIS_REST_URL;
const TOKEN = ENV.UPSTASH_REDIS_REST_TOKEN;

const redis = {
  set: async (key, value, ...args) => {
    let url = `${BASE_URL}/set/${key}/${encodeURIComponent(value)}`;

    if (args.length >= 2) {
      for (let i = 0; i < args.length; i += 2) {
        const option = args[i].toUpperCase();
        const ttl = args[i + 1];
        if (option === "EX") {
          url += `?ex=${ttl}`;
        } else if (option === "PX") {
          url += `?px=${ttl}`;
        }
      }
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    return res.json();
  },

  get: async (key) => {
    const res = await fetch(`${BASE_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = await res.json();
    return data.result;
  },

  del: async (key) => {
    try {
      const url = `${BASE_URL}/del/${encodeURIComponent(key)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Redis error:", res.status, res.statusText);
        return { result: 0, error: `HTTP error ${res.status}` };
      }

      const data = await res.json();

      return data;
    } catch (error) {
      console.error("Redis request failed:", error);
      return { result: 0, error: error.message };
    }
  },
};

export default redis;
