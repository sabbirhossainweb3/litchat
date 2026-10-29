import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserProvider, Contract, isAddress } from 'ethers';
import { Activity, ArrowDownLeft, ArrowUpRight, Check, ChevronDown, CircleHelp, Copy, ExternalLink, Inbox, LockKeyhole, MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, Wallet, Zap } from 'lucide-react';
import './style.css';

const CHAIN_ID = '0x1159'; // 4441
const NETWORK = { chainId: CHAIN_ID, chainName: 'LitVM LiteForge', nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 }, rpcUrls: ['https://liteforge.rpc.caldera.xyz/http'], blockExplorerUrls: ['https://liteforge.explorer.caldera.xyz'] };
const ADDRESS = (import.meta.env.VITE_LITCHAT_CONTRACT_ADDRESS || '').trim();
const ABI = [
  'function messageCount() view returns (uint256)',
  'function getMessage(uint256 id) view returns ((address sender,address receiver,uint64 timestamp,string content))',
  'function getInbox(address user) view returns (uint256[])',
  'function getSent(address user) view returns (uint256[])',
  'function sendMessage(address receiver,string content) returns (uint256)',
  'event MessageSent(uint256 indexed messageId,address indexed sender,address indexed receiver,uint64 timestamp,string content)'
];
const short = (s) => s ? `${s.slice(0, 6)}…${s.slice(-4)}` : '';
const date = (v) => new Date(Number(v) * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('inbox');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  const configured = Boolean(ADDRESS && isAddress(ADDRESS));
  const connect = useCallback(async () => {
    try {
      if (!window.ethereum) { setNotice({ type: 'error', text: 'MetaMask was not found. Install the MetaMask browser extension first.' }); return; }
      const p = new BrowserProvider(window.ethereum);
      await p.send('eth_requestAccounts', []);
      const network = await p.getNetwork();
      if (Number(network.chainId) !== 4441) {
        try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID }] }); }
        catch (e) {
          if (e.code === 4902) await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [NETWORK] });
          else throw e;
        }
      }
      const signer = await p.getSigner();
      const address = await signer.getAddress();
      setProvider(p); setAccount(address);
      if (configured) setContract(new Contract(ADDRESS, ABI, signer));
      setNotice({ type: 'success', text: 'Wallet connected to LitVM LiteForge.' });
    } catch (e) { setNotice({ type: 'error', text: e.shortMessage || e.message || 'Wallet connection failed.' }); }
  }, [configured]);

  const loadMessages = useCallback(async () => {
    if (!provider || !account || !configured) return;
    setBusy(true);
    try {
      const reader = new Contract(ADDRESS, ABI, provider);
      const ids = tab === 'inbox' ? await reader.getInbox(account) : await reader.getSent(account);
      const latest = ids.slice(-60).reverse();
      const rows = await Promise.all(latest.map(async (id) => {
        const m = await reader.getMessage(id);
        return { id: id.toString(), sender: m.sender, receiver: m.receiver, timestamp: m.timestamp.toString(), content: m.content };
      }));
      setMessages(rows);
      if (selected) setSelected(rows.find(m => m.id === selected.id) || null);
      setNotice({ type: '', text: '' });
    } catch (e) { setNotice({ type: 'error', text: `Could not load messages: ${e.shortMessage || e.message}` }); }
    finally { setBusy(false); }
  }, [provider, account, configured, tab]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => { setAccount(accounts[0] || ''); setSelected(null); };
    const onChain = () => window.location.reload();
    window.ethereum.on?.('accountsChanged', onAccounts);
    window.ethereum.on?.('chainChanged', onChain);
    return () => { window.ethereum.removeListener?.('accountsChanged', onAccounts); window.ethereum.removeListener?.('chainChanged', onChain); };
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!contract) { setNotice({ type: 'error', text: 'Connect your wallet and configure the deployed contract address first.' }); return; }
    if (!isAddress(recipient)) { setNotice({ type: 'error', text: 'Enter a valid receiver wallet address.' }); return; }
    if (!content.trim() || new TextEncoder().encode(content.trim()).length > 500) { setNotice({ type: 'error', text: 'Message must be 1–500 bytes.' }); return; }
    setBusy(true); setNotice({ type: 'info', text: 'Confirm the transaction in MetaMask…' });
    try {
      const tx = await contract.sendMessage(recipient.trim(), content.trim());
      setNotice({ type: 'info', text: `Transaction submitted: ${short(tx.hash)}. Waiting for confirmation…` });
      await tx.wait(); setContent(''); setRecipient('');
      setNotice({ type: 'success', text: 'Message recorded on LitVM. It is public on-chain.' });
      setTab('sent');
    } catch (e) { setNotice({ type: 'error', text: e.shortMessage || e.reason || e.message || 'Transaction failed.' }); }
    finally { setBusy(false); }
  };

  const copyAddress = async () => { await navigator.clipboard.writeText(account); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  const current = useMemo(() => selected || messages[0] || null, [selected, messages]);

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-mark"><MessageCircle size={21}/><i/></span><span>Lit<span className="brand-accent">Chat</span><small>MESSAGING ON LITVM</small></span></a>
      <nav><a className="nav-active" href="#messenger">Messenger</a><a href="#how">How it works</a></nav>
      <button className={`wallet-button ${account ? 'connected' : ''}`} onClick={connect}><Wallet size={17}/>{account ? short(account) : 'Connect wallet'}<span className="wallet-dot"/></button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> LITVM LITEFORGE TESTNET <span className="eyebrow-divider">/</span> CHAIN 4441</div>
          <h1>Messages that<br/>move on <span>chain.</span></h1>
          <p>A new way to connect wallet-to-wallet. Simple, transparent, and powered by LitVM.</p>
          <div className="hero-actions"><button className="primary-button" onClick={account ? () => document.getElementById('recipient')?.focus() : connect}>{account ? 'Write a message' : 'Get started'}<ArrowUpRight size={17}/></button><a className="text-link" href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noreferrer">Explore LitVM <ExternalLink size={14}/></a></div>
          <div className="hero-proof"><span><ShieldCheck size={15}/> Wallet-based identity</span><span><Zap size={15}/> On-chain records</span></div>
        </div>
        <div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="hero-glow"/><div className="hero-card card-back"><span className="mini-avatar">LC</span><div><b>Wallet connected</b><small>Identity verified by signature</small></div><Check size={16}/></div><div className="hero-card message-card"><div className="message-card-top"><span className="mini-avatar purple">✳</span><div><b>On-chain message</b><small>Just now · LitVM</small></div><span className="verified-pill"><Check size={11}/> Saved</span></div><div className="fake-bubble">Hey! 👋 Welcome to LitChat.</div><div className="fake-bubble outgoing">A new home for wallet-to-wallet chat. <Sparkles size={13}/></div><div className="message-card-bottom"><span><span className="tiny-dot"/> Transaction confirmed</span><span>0x7a…92d1</span></div></div><div className="floating-chip"><span className="chip-icon"><LockKeyhole size={15}/></span><div><b>Your wallet, your identity</b><small>No email signup required</small></div></div></div>
      </section>

      <section className="stats-row"><div className="stat"><span className="stat-icon"><Wallet size={17}/></span><div><small>IDENTITY</small><b>Wallet-powered</b></div></div><div className="stat"><span className="stat-icon"><Activity size={17}/></span><div><small>NETWORK</small><b>LitVM LiteForge</b></div></div><div className="stat"><span className="stat-icon"><ShieldCheck size={17}/></span><div><small>MESSAGE STORAGE</small><b>Public on-chain</b></div></div><div className="stat"><span className="stat-icon"><Sparkles size={17}/></span><div><small>BUILT FOR</small><b>Web3 communities</b></div></div></section>

      <section className="messenger-section" id="messenger"><div className="section-heading"><div><div className="eyebrow">YOUR WEB3 INBOX</div><h2>Messaging <span>workspace</span></h2></div><button className="icon-button" title="Refresh messages" onClick={loadMessages} disabled={busy}><RefreshCw size={16} className={busy ? 'spin' : ''}/></button></div>
        {!configured && <div className="setup-banner"><CircleHelp size={19}/><div><b>One setup step left</b><p>Deploy the included LitChat contract to LitVM LiteForge, then add its address to <code>.env</code> as <code>VITE_LITCHAT_CONTRACT_ADDRESS</code> and redeploy.</p></div></div>}
        {notice.text && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
        <div className="workspace">
          <aside className="inbox-panel"><div className="inbox-head"><div><span className="panel-label">MESSAGES</span><h3>Your inbox</h3></div><span className="count-badge">{messages.length}</span></div><div className="tabs"><button className={tab === 'inbox' ? 'tab active' : 'tab'} onClick={() => {setTab('inbox');setSelected(null)}}><Inbox size={15}/> Inbox</button><button className={tab === 'sent' ? 'tab active' : 'tab'} onClick={() => {setTab('sent');setSelected(null)}}><ArrowUpRight size={15}/> Sent</button></div>
          {!account ? <div className="empty-state"><span className="empty-icon"><Wallet size={23}/></span><b>Connect your wallet</b><p>Your messages will appear here once you connect to LitVM.</p><button className="secondary-button" onClick={connect}>Connect MetaMask</button></div> : !configured ? <div className="empty-state"><span className="empty-icon"><MessageCircle size={23}/></span><b>Almost ready</b><p>Deploy the contract to activate your on-chain inbox.</p></div> : messages.length === 0 ? <div className="empty-state"><span className="empty-icon"><MessageCircle size={23}/></span><b>No messages yet</b><p>{tab === 'inbox' ? 'Messages sent to your wallet will show up here.' : 'Messages you send will show up here.'}</p></div> : <div className="message-list">{messages.map(m => <button className={`message-item ${current?.id === m.id ? 'selected' : ''}`} key={m.id} onClick={() => setSelected(m)}><span className="contact-avatar">{(tab === 'inbox' ? m.sender : m.receiver).slice(2,4).toUpperCase()}</span><span className="message-item-copy"><b>{short(tab === 'inbox' ? m.sender : m.receiver)}</b><span>{m.content}</span><small>{date(m.timestamp)}</small></span><ChevronDown size={14} className="item-chevron"/></button>)}</div>}
          <div className="inbox-foot"><span className="live-dot"/> Connected to LitVM testnet</div></aside>
          <div className="chat-panel"><div className="chat-header"><div className="chat-header-icon"><MessageCircle size={19}/></div><div><b>{current ? short(tab === 'inbox' ? current.sender : current.receiver) : 'New message'}</b><small>{current ? `Message #${current.id} · ${date(current.timestamp)}` : 'Send a message to any wallet'}</small></div><span className="chain-tag"><span className="tiny-dot"/> ON-CHAIN</span></div>
            <div className="chat-body">{current && <div className="selected-message"><div className="message-meta"><span>{tab === 'inbox' ? 'FROM' : 'TO'}</span><code>{tab === 'inbox' ? current.sender : current.receiver}</code><button className="inline-icon" onClick={() => navigator.clipboard.writeText(tab === 'inbox' ? current.sender : current.receiver)} title="Copy address"><Copy size={13}/></button></div><div className="chat-bubble">{current.content}</div><div className="message-details"><span><Check size={13}/> Recorded on-chain</span><a href={`https://liteforge.explorer.caldera.xyz/address/${ADDRESS}`} target="_blank" rel="noreferrer">View contract <ExternalLink size={12}/></a></div></div>}
              {!current && <div className="welcome-empty"><div className="welcome-orb"><MessageCircle size={27}/></div><h3>Your next conversation starts here.</h3><p>Send a wallet-to-wallet message on LitVM. Every message is stored publicly on-chain.</p><div className="welcome-pills"><span><Zap size={13}/> LitVM powered</span><span><Wallet size={13}/> Wallet identity</span></div></div>}
            </div>
            <form className="compose" onSubmit={send}><label htmlFor="recipient">RECIPIENT WALLET ADDRESS</label><input id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x… Enter receiver address" spellCheck="false" autoComplete="off"/><label htmlFor="content">YOUR MESSAGE <span>{new TextEncoder().encode(content).length}/500 bytes</span></label><div className="compose-box"><textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something thoughtful…" maxLength={500} rows={3}/><button className="send-button" type="submit" disabled={busy || !account || !configured || !content.trim()}><Send size={16}/><span>{busy ? 'Processing…' : 'Send on-chain'}</span></button></div><div className="compose-note"><LockKeyhole size={13}/><span>Never share passwords or secrets. Messages are public and permanent.</span><span className="gas-note">Gas fees apply</span></div></form>
          </div>
        </div>
      </section>

      <section className="how-section" id="how"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Chat in three steps.</h2><div className="steps"><div className="step"><span>01</span><Wallet size={22}/><h3>Connect wallet</h3><p>Use MetaMask to connect your wallet to LitVM LiteForge.</p></div><div className="step"><span>02</span><Send size={22}/><h3>Send a message</h3><p>Enter a recipient address, write your message, and confirm the transaction.</p></div><div className="step"><span>03</span><Check size={22}/><h3>On-chain record</h3><p>After confirmation, the message can be retrieved from the contract.</p></div></div></section>
      <section className="privacy-note"><ShieldCheck size={20}/><div><b>A note on privacy</b><p>This starter stores message text directly on a public blockchain. Anyone can inspect it, and it cannot be deleted. Use test messages only. For real private conversations, use audited end-to-end encryption and off-chain storage before launch.</p></div></section>
    </main>
    <footer><a className="footer-brand" href="#top"><span className="brand-mark small"><MessageCircle size={15}/></span>Lit<span className="brand-accent">Chat</span></a><span>Built for the open web <span className="footer-dot">✳</span> LitVM LiteForge</span><a href="https://docs.litvm.com/get-started-on-testnet/add-to-wallet" target="_blank" rel="noreferrer">Network docs <ExternalLink size={12}/></a></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
