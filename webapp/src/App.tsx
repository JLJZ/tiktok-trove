import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Upload, Gift, Wallet, User, Home, LogOut, BarChart3, Coins, Gem, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


/**
 * TikTok-Style SPA that consumes the provided OpenAPI endpoints.
 * Base server is taken from the OpenAPI: https://api.example.com/api/v1
 * Paths discovered:
 *  POST /auth/register
 *  POST /auth/login
 *  GET  /users/{id}
 *  PUT  /users/{id}
 *  POST /videos
 *  GET  /videos/{id}
 *  DELETE /videos/{id}
 *  GET  /videos/{id}/stats
 *  GET  /gifts/catalog
 *  POST /gifts/send
 *  GET  /gifts/video/{videoId}
 *  GET  /wallet
 *  POST /wallet/coins/purchase
 *  POST /wallet/diamonds/convert
 *  GET  /wallet/transactions
 *  GET  /fraud/video/{videoId}
 *  GET  /fraud/user/{userId}
 *  POST /fraud/review/{giftTxnId}
 *
 * Assumptions for request/response shapes are noted inline.
 */

/****************************
 * API CLIENT
 ****************************/
const API_URL = import.meta.env.API_URL || "http://localhost:3000"; // change if needed

type LoginReq = { email: string; password: string };
// Assumed response: { token: string, user: { id: string, name: string, avatarUrl?: string } }
type LoginRes = { token: string; user: { id: string; name: string; avatarUrl?: string } };

type UserProfile = { id: string; name: string; avatarUrl?: string };

type VideoMeta = { id: string; title: string; url: string; thumbnailUrl?: string; ownerId: string };

type VideoStats = { views: number; likes: number; comments: number; giftsCount: number; diamondsEarned: number };

type Gift = { id: string; name: string; coinPrice: number; imageUrl?: string };

type Wallet = { coins: number; diamonds: number; payoutUSD: number };

type GiftSendReq = { videoId: string; giftId: string; quantity: number };
// Assumed response: { success: boolean, remainingCoins: number, txId: string }

type CoinsPurchaseReq = { amountCoins: number };
// Assumed response: { success: boolean, newBalance: Wallet }

type DiamondsConvertReq = { diamonds: number };
// Assumed response: { success: boolean, newBalance: Wallet }

type Txn = { id: string; type: string; amount: number; createdAt: string };

async function api<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": opts.body instanceof FormData ? "" : "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  // Some endpoints may return 204
  try { return await res.json(); } catch { return undefined as unknown as T; }
}

const AuthCtx = createContext<{ token: string | null; user: UserProfile | null; setAuth: (t: string|null, u: UserProfile|null) => void }>({ token: null, user: null, setAuth: () => {} });
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const setAuth = (t: string | null, u: UserProfile | null) => {
    setToken(t);
    setUser(u);
    if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
    if (u) localStorage.setItem("user", JSON.stringify(u)); else localStorage.removeItem("user");
  };
  return <AuthCtx.Provider value={{ token, user, setAuth }}>{children}</AuthCtx.Provider>;
}

/****************************
 * UI PRIMITIVES
 ****************************/
function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md min-h-screen bg-black text-white">{children}</div>;
}

function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur">
      <div className="font-bold text-lg">{title}</div>
      <div>{right}</div>
    </div>
  );
}

function BottomNav() {
  const { token } = useAuth();
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/80 backdrop-blur border-t border-white/10">
      <div className="grid grid-cols-4">
        <NavItem to="/" icon={<Home size={20} />} label="Home" />
        <NavItem to="/upload" icon={<Upload size={20} />} label="Upload" />
        <NavItem to="/wallet" icon={<Wallet size={20} />} label="Wallet" />
        <NavItem to={token ? "/profile" : "/login"} icon={<User size={20} />} label={token ? "Profile" : "Login"} />
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center py-2 text-xs text-white/80 hover:text-white">
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}

/****************************
 * AUTH PAGES
 ****************************/
function LoginPage() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onLogin = async () => {
    try {
      setLoading(true);
      const data = await api<LoginRes>(`/auth/login`, { method: "POST", body: JSON.stringify({ email, password } as LoginReq) });
      setAuth(data.token, data.user);
      nav("/");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <TopBar title="Login" />
      <div className="px-4 pt-6 pb-28">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={onLogin} disabled={loading} className="w-full rounded-2xl">{loading ? "Logging in" : "Login"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </Page>
  );
}

function ProfilePage() {
  const { user, setAuth } = useAuth();
  const nav = useNavigate();
  if (!user) return <RequireLogin />;
  return (
    <Page>
      <TopBar title="Profile" right={<Button variant="ghost" onClick={() => { setAuth(null, null); nav("/login"); }}><LogOut className="mr-1" size={16}/>Logout</Button>} />
      <div className="px-4 pt-4 pb-28">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-white/60">id: {user.id}</div>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/wallet" className="block py-3 text-white/80 hover:text-white">Wallet</Link>
        </div>
      </div>
      <BottomNav />
    </Page>
  );
}

function RequireLogin() {
  return (
    <Page>
      <TopBar title="Login Required" />
      <div className="p-6 pb-28">You must log in to continue.</div>
      <BottomNav />
    </Page>
  );
}

/****************************
 * FEED + VIDEO + GIFTING
 ****************************/
function FeedPage() {
  // Simplified: one highlighted video id for demo; in real app, fetch feed list
  const currentId = "demo-video-1";
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // Fetch video metadata
    (async () => {
      try {
        const m = await api<VideoMeta>(`/videos/${encodeURIComponent(currentId)}`, { method: "GET" }, token || undefined);
        setMeta(m);
        const s = await api<VideoStats>(`/videos/${encodeURIComponent(currentId)}/stats`, { method: "GET" }, token || undefined);
        setStats(s);
      } catch (e) {
        // demo fallback
        setMeta({ id: currentId, title: "Demo video", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", ownerId: "u1" });
        setStats({ views: 1234, likes: 222, comments: 15, giftsCount: 7, diamondsEarned: 120 });
      }
    })();
  }, [currentId, token]);

  return (
    <Page>
      <TopBar title="For You" right={<Link to={`/video/${currentId}/stats`} className="text-white/80"><BarChart3 size={18}/></Link>} />
      <div className="relative h-[calc(100vh-120px)]">
        {meta && <VideoCard meta={meta} />}
        <StickerTray videoId={currentId} />
        {stats && (
          <div className="absolute right-2 bottom-32 space-y-3 text-center">
            <Metric icon={<HeartIcon/>} label={"Likes"} value={abbrev(stats.likes)} />
            <Metric icon={<Gift size={18}/>} label={"Gifts"} value={abbrev(stats.giftsCount)} />
            <Metric icon={<Gem size={18}/>} label={"Diamonds"} value={abbrev(stats.diamondsEarned)} />
          </div>
        )}
      </div>
      <BottomNav />
    </Page>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-black/50 rounded-2xl px-3 py-2 border border-white/10">
      <div className="flex items-center justify-center space-x-2">
        {icon}
        <div className="text-sm">{value}</div>
      </div>
      <div className="text-[10px] text-white/60">{label}</div>
    </div>
  );
}

function VideoCard({ meta }: { meta: VideoMeta }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  useEffect(() => {
    const v = videoRef.current; if (!v) return; v.play().catch(() => {});
  }, [meta.id]);
  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} src={meta.url} className="w-full h-full object-cover" loop playsInline muted={false} />
      <button onClick={toggle} className="absolute left-1/2 -translate-x-1/2 bottom-36 bg-black/40 rounded-full p-3 border border-white/10">
        {playing ? <Pause size={18}/> : <Play size={18} />}
      </button>
      <div className="absolute left-3 bottom-24">
        <div className="font-semibold">{meta.title}</div>
        <div className="text-xs text-white/70">@{meta.ownerId}</div>
      </div>
    </div>
  );
}

function StickerTray({ videoId }: { videoId: string }) {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState<Gift[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ name: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await api<Gift[]>(`/gifts/catalog`, { method: "GET" }, token || undefined);
        setCatalog(items);
      } catch {
        setCatalog([
          { id: "g1", name: "Rose", coinPrice: 1, imageUrl: "https://img.icons8.com/?size=100&id=21826&format=png" },
          { id: "g2", name: "Heart", coinPrice: 5, imageUrl: "https://img.icons8.com/?size=100&id=59809&format=png" },
          { id: "g3", name: "FIRE", coinPrice: 10, imageUrl: "https://img.icons8.com/?size=100&id=59803&format=png" },
        ]);
      }
    })();
  }, [token]);

  const send = async (gift: Gift) => {
    if (!token) { alert("Login required"); return; }
    try {
      setSending(gift.id);
      await api(`/gifts/send`, { method: "POST", body: JSON.stringify({ videoId, giftId: gift.id, quantity: 1 } as GiftSendReq) }, token);
      setFlash({ name: gift.name });
      setTimeout(() => setFlash(null), 1500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="absolute left-0 right-0 bottom-16">
      <div className="flex gap-2 overflow-x-auto px-3">
        {catalog.map(g => (
          <button key={g.id} onClick={() => send(g)} className="min-w-[90px] bg-black/60 border border-white/10 rounded-2xl p-2 text-left">
            <div className="flex items-center gap-2">
              <img src={g.imageUrl || ""} alt={g.name} className="w-8 h-8 object-contain" />
              <div>
                <div className="text-sm">{g.name}</div>
                <div className="text-xs text-white/60 flex items-center gap-1"><Coins size={12}/> {g.coinPrice}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-1/2 -translate-x-1/2 bottom-24 bg-black/70 border border-white/10 rounded-2xl px-4 py-2">
            Sent {flash.name}
          </motion.div>
        )}
      </AnimatePresence>
      {sending && <div className="absolute right-3 bottom-24 text-xs text-white/70">Sending...</div>}
    </div>
  );
}

/****************************
 * UPLOAD
 ****************************/
function UploadPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!token) { alert("Login required"); return; }
    if (!file) { alert("Select a file"); return; }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      await api(`/videos`, { method: "POST", body: fd }, token);
      alert("Uploaded");
      setTitle(""); setFile(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <TopBar title="Upload" />
      <div className="px-4 pt-6 pb-28 space-y-3">
        <input className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="rounded-xl bg-black/60 border border-white/10 p-3">
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <Button onClick={upload} disabled={loading} className="w-full rounded-2xl">{loading ? "Uploading" : "Upload"}</Button>
      </div>
      <BottomNav />
    </Page>
  );
}

/****************************
 * VIDEO STATS PAGE
 ****************************/
function VideoStatsPage({ videoId }: { videoId: string }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [gifts, setGifts] = useState<{ giftId: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await api<VideoStats>(`/videos/${videoId}/stats`, { method: "GET" }, token || undefined);
        setStats(s);
      } catch {
        setStats({ views: 3210, likes: 420, comments: 55, giftsCount: 23, diamondsEarned: 233 });
      }
      try {
        const g = await api<{ giftId: string; count: number }[]>(`/gifts/video/${videoId}`, { method: "GET" }, token || undefined);
        setGifts(g);
      } catch {
        setGifts([{ giftId: "g1", count: 10 }, { giftId: "g3", count: 2 }]);
      }
    })();
  }, [videoId, token]);

  return (
    <Page>
      <TopBar title="Video Stats" />
      <div className="px-4 pt-4 pb-28 space-y-4">
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Views" value={abbrev(stats.views)} />
            <StatBox label="Likes" value={abbrev(stats.likes)} />
            <StatBox label="Comments" value={abbrev(stats.comments)} />
            <StatBox label="Gifts" value={abbrev(stats.giftsCount)} />
            <StatBox label="Diamonds" value={abbrev(stats.diamondsEarned)} />
          </div>
        )}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Gifts Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gifts.map(g => (
                <div key={g.giftId} className="flex justify-between text-sm">
                  <div>Gift {g.giftId}</div>
                  <div>x{g.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </Page>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-black/60 border border-white/10 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

/****************************
 * WALLET: coins → diamonds → money
 ****************************/
function WalletPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [coinsToBuy, setCoinsToBuy] = useState(0);
  const [diamondsToCash, setDiamondsToCash] = useState(0);

  const refresh = async () => {
    try {
      const w = await api<Wallet>(`/wallet`, { method: "GET" }, token || undefined);
      setWallet(w);
    } catch {
      setWallet({ coins: 100, diamonds: 55, payoutUSD: 20 });
    }
  };

  useEffect(() => { refresh(); }, [token]);

  const purchase = async () => {
    try {
      await api(`/wallet/coins/purchase`, { method: "POST", body: JSON.stringify({ amountCoins: coinsToBuy } as CoinsPurchaseReq) }, token || undefined);
      setCoinsToBuy(0);
      await refresh();
    } catch (e: any) { alert(e.message); }
  };

  const convert = async () => {
    try {
      await api(`/wallet/diamonds/convert`, { method: "POST", body: JSON.stringify({ diamonds: diamondsToCash } as DiamondsConvertReq) }, token || undefined);
      setDiamondsToCash(0);
      await refresh();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <Page>
      <TopBar title="Wallet" />
      <div className="px-4 pt-4 pb-28 space-y-4">
        {wallet && (
          <div className="grid grid-cols-3 gap-3">
            <WalletBox icon={<Coins size={18}/>} label="Coins" value={wallet.coins} />
            <WalletBox icon={<Gem size={18}/>} label="Diamonds" value={wallet.diamonds} />
            <WalletBox icon={<DollarSign size={18}/>} label="USD" value={`$${wallet.payoutUSD}`} />
          </div>
        )}

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-white">Buy Coins</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input type="number" className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10" value={coinsToBuy} onChange={(e)=>setCoinsToBuy(parseInt(e.target.value||"0"))} />
              <Button onClick={purchase} className="rounded-2xl">Purchase</Button>
            </div>
            <div className="text-xs text-white/60 mt-2">Coins are used to send sticker gifts. Gift coin prices appear in the catalog.</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-white">Convert Diamonds → Money</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input type="number" className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10" value={diamondsToCash} onChange={(e)=>setDiamondsToCash(parseInt(e.target.value||"0"))} />
              <Button onClick={convert} className="rounded-2xl">Convert</Button>
            </div>
            <div className="text-xs text-white/60 mt-2">Diamonds accumulate from gifts. Convert to payout balance.</div>
          </CardContent>
        </Card>

        <TransactionsList />
      </div>
      <BottomNav />
    </Page>
  );
}

function WalletBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-black/60 border border-white/10 p-3 text-center">
      <div className="flex items-center justify-center gap-2 text-sm">{icon}<span>{label}</span></div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function TransactionsList() {
  const { token } = useAuth();
  const [tx, setTx] = useState<Txn[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const items = await api<Txn[]>(`/wallet/transactions`, { method: "GET" }, token || undefined);
        setTx(items);
      } catch {
        setTx([
          { id: "t1", type: "gifts.send", amount: -10, createdAt: new Date().toISOString() },
          { id: "t2", type: "diamonds.convert", amount: 100, createdAt: new Date().toISOString() },
        ]);
      }
    })();
  }, [token]);
  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader><CardTitle className="text-white">Transactions</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tx.map(t => (
            <div key={t.id} className="flex justify-between text-sm">
              <div>{t.type}</div>
              <div>{t.amount}</div>
              <div className="text-white/60">{new Date(t.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/****************************
 * ROUTER WRAPPER
 ****************************/
function RoutedVideoStats() {
  const id = window.location.pathname.split("/").pop() || "";
  return <VideoStatsPage videoId={id} />;
}

function AppShell() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<FeedPage/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/profile" element={<ProfilePage/>} />
          <Route path="/upload" element={<UploadPage/>} />
          <Route path="/wallet" element={<WalletPage/>} />
          <Route path="/video/:id/stats" element={<RoutedVideoStats/>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/****************************
 * HELPERS
 ****************************/
function abbrev(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+"M";
  if (n >= 1_000) return (n/1_000).toFixed(1)+"K";
  return String(n);
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21s-6.716-4.388-9.428-7.1C.86 12.188.5 10.57.5 9A5.5 5.5 0 0 1 6 3.5c1.54 0 3.04.66 4 1.71A5.656 5.656 0 0 1 14 3.5 5.5 5.5 0 0 1 19.5 9c0 1.57-.36 3.188-2.072 4.9C18.716 16.612 12 21 12 21z" />
    </svg>
  );
}

export default function App() { return <AppShell/>; }
