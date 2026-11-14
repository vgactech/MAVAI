import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, custom, http, formatEther, formatUnits, parseEther, parseUnits, type Address, type EIP1193Provider } from "viem";
import { bsc } from "viem/chains";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { analyzeBnb, checkApis, getBnbMarket, listTrades, recordTrade, updateTrade } from "@/lib/bnb.functions";
import { BSC_CHAIN_ID, MAX_TRADE_BNB, PANCAKE_ROUTER, USDT, WBNB, checkTrade, minOut } from "@/lib/bnb";

const routerAbi = [
  { name: "getAmountsOut", type: "function", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }, { name: "path", type: "address[]" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
  { name: "swapExactETHForTokens", type: "function", stateMutability: "payable", inputs: [{ name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
  { name: "swapExactTokensForETH", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
] as const;
const erc20Abi = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
const publicClient = createPublicClient({ chain: bsc, transport: http("https://bsc-dataseed.bnbchain.org") });
const eth = () => (globalThis as unknown as { ethereum?: EIP1193Provider }).ethereum;

export function BnbDesk() {
  const qc = useQueryClient();
  const marketFn = useServerFn(getBnbMarket); const analyzeFn = useServerFn(analyzeBnb); const apisFn = useServerFn(checkApis);
  const tradesFn = useServerFn(listTrades); const recordFn = useServerFn(recordTrade); const updateFn = useServerFn(updateTrade);
  const market = useQuery({ queryKey: ["bnb-market"], queryFn: () => marketFn(), refetchInterval: 30_000 });
  const apis = useQuery({ queryKey: ["bnb-apis"], queryFn: () => apisFn() });
  const trades = useQuery({ queryKey: ["bnb-trades"], queryFn: () => tradesFn() });
  const [account, setAccount] = useState<Address | null>(null);
  const [balances, setBalances] = useState<{ bnb: number; usdt: number; gwei: number } | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0.01");
  const [slippage, setSlippage] = useState(100);
  const [quote, setQuote] = useState<{ out: bigint; at: number } | null>(null);
  const [busy, setBusy] = useState("");
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyzeBnb>> | null>(null);

  async function refreshBalances(a: Address) {
    const [b, u, g] = await Promise.all([publicClient.getBalance({ address: a }), publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [a] }), publicClient.getGasPrice()]);
    setBalances({ bnb: Number(formatEther(b)), usdt: Number(formatUnits(u, 18)), gwei: Number(formatUnits(g, 9)) });
  }
  async function connect() {
    const p = eth(); if (!p) { toast.error("Aucun wallet détecté. Installez MetaMask ou Trust Wallet, ou ouvrez la page dans leur navigateur."); return; }
    const w = createWalletClient({ chain: bsc, transport: custom(p) });
    const [a] = await w.requestAddresses(); if (!a) return;
    if ((await w.getChainId()) !== BSC_CHAIN_ID) await w.switchChain({ id: BSC_CHAIN_ID }).catch(() => toast.error("Passez votre wallet sur BNB Smart Chain."));
    setAccount(a); await refreshBalances(a);
  }
  useEffect(() => { setQuote(null); }, [side, amount, slippage]);
  const parsedIn = () => { try { return side === "buy" ? parseEther(amount || "0") : parseUnits(amount || "0", 18); } catch { return 0n; } };
  async function getQuote() {
    const amountIn = parsedIn(); if (!amountIn) { toast.error("Montant invalide."); return; }
    const path = side === "buy" ? [WBNB, USDT] : [USDT, WBNB];
    const amounts = await publicClient.readContract({ address: PANCAKE_ROUTER, abi: routerAbi, functionName: "getAmountsOut", args: [amountIn, path] });
    setQuote({ out: amounts[1]!, at: Date.now() });
  }
  async function execute() {
    if (!account || !balances || !quote) return;
    const issues = checkTrade({ side, amountBnb: side === "buy" ? Number(amount) : 0, amountUsdt: side === "sell" ? Number(amount) : 0, balanceBnb: balances.bnb, balanceUsdt: balances.usdt, priceAgeMs: Date.now() - quote.at, slippageBps: slippage });
    if (issues.length) { issues.forEach(i => toast.error(i)); return; }
    const p = eth(); if (!p) return;
    const w = createWalletClient({ account, chain: bsc, transport: custom(p) });
    const amountIn = parsedIn(); const min = minOut(quote.out, slippage); const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    const row = await recordFn({ data: { walletAddress: account, side, tokenIn: side === "buy" ? "BNB" : "USDT", tokenOut: side === "buy" ? "USDT" : "BNB", amountIn: amountIn.toString(), minAmountOut: min.toString(), quotedAmountOut: quote.out.toString(), slippageBps: slippage } });
    try {
      setBusy("Signature dans votre wallet…");
      if (side === "sell") {
        const allowance = await publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "allowance", args: [account, PANCAKE_ROUTER] });
        if (allowance < amountIn) { const h = await w.writeContract({ address: USDT, abi: erc20Abi, functionName: "approve", args: [PANCAKE_ROUTER, amountIn] }); setBusy("Autorisation USDT en confirmation…"); await publicClient.waitForTransactionReceipt({ hash: h }); setBusy("Signature du swap…"); }
      }
      const hash = side === "buy"
        ? await w.writeContract({ address: PANCAKE_ROUTER, abi: routerAbi, functionName: "swapExactETHForTokens", args: [min, [WBNB, USDT], account, deadline], value: amountIn })
        : await w.writeContract({ address: PANCAKE_ROUTER, abi: routerAbi, functionName: "swapExactTokensForETH", args: [amountIn, min, [USDT, WBNB], account, deadline] });
      await updateFn({ data: { id: row.id, status: "submitted", txHash: hash } }); setBusy("Transaction envoyée, attente de confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const ok = receipt.status === "success";
      await updateFn({ data: { id: row.id, status: ok ? "confirmed" : "failed", txHash: hash, blockNumber: Number(receipt.blockNumber), ...(ok ? {} : { error: "Transaction annulée sur la chaîne (revert)." }) } });
      ok ? toast.success("Trade confirmé sur BNB Chain.") : toast.error("Transaction échouée sur la chaîne.");
      await refreshBalances(account);
    } catch (e) {
      const msg = e instanceof Error ? e.message.split("\n")[0]!.slice(0, 300) : "Erreur";
      const rejected = /reject|denied/i.test(msg);
      await updateFn({ data: { id: row.id, status: rejected ? "rejected" : "failed", error: msg } }).catch(() => {});
      toast.error(rejected ? "Signature refusée dans le wallet." : msg);
    } finally { setBusy(""); setQuote(null); void qc.invalidateQueries({ queryKey: ["bnb-trades"] }); }
  }
  async function analyze() { setBusy("Analyse en cours…"); try { setAnalysis(await analyzeFn({ data: { question } })); } catch (e) { toast.error(e instanceof Error ? e.message : "Analyse impossible."); } finally { setBusy(""); } }

  const m = market.data; const outFmt = quote ? Number(formatUnits(quote.out, 18)) : null;
  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2">
      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Marché BNB/USDT</h2>
        {market.isError ? <p className="text-sm text-destructive">{String(market.error)}</p> : !m ? <p className="text-sm text-muted-foreground">Chargement…</p> : <>
          <p className="mt-2 text-3xl font-semibold">{m.price.toFixed(2)} <span className="text-base text-muted-foreground">USDT</span></p>
          <p className={`text-sm ${m.change24h >= 0 ? "text-primary" : "text-destructive"}`}>{m.change24h.toFixed(2)} % sur 24 h · haut {m.high.toFixed(2)} · bas {m.low.toFixed(2)}</p>
          <Spark values={m.closes.map(c => c.close)} />
          <p className="text-xs text-muted-foreground">Source : {m.source} · collecte {new Date(m.fetchedAt).toLocaleTimeString("fr-FR")}</p></>}
      </section>
      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Wallet</h2>
        {!account ? <Button className="mt-3" onClick={() => void connect()}>Connecter mon wallet</Button> : <div className="mt-2 space-y-1 text-sm">
          <p className="font-mono text-xs">{account}</p>
          {balances && <><p>{balances.bnb.toFixed(5)} BNB · {balances.usdt.toFixed(2)} USDT</p><p className="text-muted-foreground">Frais réseau : {balances.gwei.toFixed(2)} gwei</p></>}
        </div>}
        <p className="mt-3 text-xs text-muted-foreground">MAVAI ne détient aucune clé. Chaque transaction est vérifiée par un contrôleur (plafond {MAX_TRADE_BNB} BNB, slippage ≤ 3 %, prix &lt; 1 min, solde) puis signée par vous dans votre wallet.</p>
      </section>
      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Préparer un trade (PancakeSwap, mainnet)</h2>
        <div className="mt-3 flex gap-2"><Button size="sm" variant={side === "buy" ? "default" : "outline"} onClick={() => setSide("buy")}>Acheter USDT avec BNB</Button><Button size="sm" variant={side === "sell" ? "default" : "outline"} onClick={() => setSide("sell")}>Vendre USDT pour BNB</Button></div>
        <label className="mt-3 block text-sm">Montant ({side === "buy" ? "BNB" : "USDT"})<Input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" /></label>
        <label className="mt-2 block text-sm">Slippage max : {(slippage / 100).toFixed(1)} %<input type="range" min={10} max={300} step={10} value={slippage} onChange={e => setSlippage(Number(e.target.value))} className="w-full" /></label>
        <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" disabled={!!busy} onClick={() => void getQuote().catch(e => toast.error(String(e)))}>Obtenir le devis</Button><Button disabled={!account || !quote || !!busy} onClick={() => void execute()}>Vérifier et signer</Button></div>
        {outFmt !== null && quote && <p className="mt-2 text-sm">Devis : ≈ {outFmt.toFixed(side === "buy" ? 2 : 6)} {side === "buy" ? "USDT" : "BNB"} · minimum garanti {Number(formatUnits(minOut(quote.out, slippage), 18)).toFixed(side === "buy" ? 2 : 6)}</p>}
        {busy && <p role="status" className="mt-2 text-sm text-muted-foreground">{busy}</p>}
      </section>
      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Analyse croisée DR MANATHAN</h2>
        <Input className="mt-3" placeholder="Question (optionnel)" value={question} onChange={e => setQuestion(e.target.value)} />
        <Button className="mt-2" variant="outline" disabled={!!busy} onClick={() => void analyze()}>Analyser</Button>
        {analysis && <div className="mt-3 space-y-2 text-sm"><p className="whitespace-pre-wrap">{analysis.analysis}</p>
          <ul className="space-y-1 text-xs">{analysis.sources.map(s => <li key={s.role}><Badge variant={s.role.startsWith("Contexte") ? "outline" : "secondary"}>{s.role}</Badge> {s.name}</li>)}</ul>
          <p className="text-xs text-muted-foreground">{analysis.model} · analyse informative, pas un conseil en investissement. Le contexte n’est pas un signal de prix prouvé.</p></div>}
      </section>
      <section className="rounded-lg border border-border p-4 md:col-span-2">
        <h2 className="font-semibold">Historique des transactions</h2>
        {!trades.data?.length ? <p className="mt-2 text-sm text-muted-foreground">Aucune transaction.</p> : <ul className="mt-2 divide-y divide-border text-sm">{trades.data.map(t => <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
          <Badge variant={t.status === "confirmed" ? "default" : t.status === "failed" || t.status === "rejected" ? "destructive" : "secondary"}>{t.status}</Badge>
          <span>{t.side === "buy" ? "Achat USDT" : "Vente USDT"} · {Number(formatUnits(BigInt(t.amount_in), 18)).toFixed(4)}</span>
          {t.tx_hash && <a className="font-mono text-xs underline" href={`https://bscscan.com/tx/${t.tx_hash}`} target="_blank" rel="noreferrer">{t.tx_hash.slice(0, 12)}…</a>}
          {t.error && <span className="text-xs text-destructive">{t.error}</span>}
          <span className="ml-auto text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("fr-FR")}</span></li>)}</ul>}
      </section>
      <section className="rounded-lg border border-border p-4 md:col-span-2">
        <h2 className="font-semibold">État réel des API</h2>
        {!apis.data ? <p className="text-sm text-muted-foreground">Vérification…</p> : <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{apis.data.map(a => <li key={a.name} className="flex items-center gap-2"><Badge variant={a.status === "fonctionne" ? "default" : a.status === "manquante" ? "outline" : "destructive"}>{a.status}</Badge><span>{a.name}</span><span className="text-xs text-muted-foreground">{a.role} · {a.detail}</span></li>)}</ul>}
      </section>
    </div>
  );
}
function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), w = 300, h = 60;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="my-2 h-16 w-full" role="img" aria-label="Cours sur 48 heures"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" /></svg>;
}
