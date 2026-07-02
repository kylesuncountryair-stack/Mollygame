/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Every page here (dashboard, leaderboard, profile, admin/*) reads live
    // data other people can change at any time (answers, log grants, new
    // questions). Next's client-side router cache would otherwise serve a
    // stale snapshot for up to 30s after navigating to a page you've
    // already visited in this session. Setting this to 0 forces a fresh
    // fetch on every navigation.
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;
