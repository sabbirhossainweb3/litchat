import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ethers} from 'ethers';
import {MessageCircle,Users,Store,Plus,Wallet,Globe,ImagePlus,ArrowUpRight,RefreshCw} from 'lucide-react';
import './style.css';

const CHAIN={chainId:'0x1159',chainName:'LitVM LiteForge',nativeCurrency:{name:'zkLTC',symbol:'zkLTC',decimals:18},rpcUrls:['https://liteforge.rpc.caldera.xyz/http'],blockExplorerUrls:['https://liteforge.explorer.caldera.xyz']};
const ABI=[
'function communityCount() view returns(uint256)','function communities(uint256) view returns(address creator,string name,string description,uint256 members)',
'function createCommunity(string name,string description)','function joinCommunity(uint256 id)',
'function nftCount() view returns(uint256)','function nfts(uint256) view returns(address creator,string name,string uri)',
'function mintNFT(string name,string uri)','function listingCount() view returns(uint256)',
'function listings(uint256) view returns(uint256 nftId,address seller,uint256 price,bool active)',
'function listNFT(uint256 nftId,uint256 priceWei)','function buyNFT(uint256 listingId) payable','function cancelListing(uint256 listingId)'
];
const addr=import.meta.env.VITE_LITCHAT_CONTRACT_ADDRESS;
const short=a=>a?`${a.slice(0,6)}...${a.slice(-4)}`:'';
function App(){
 const [account,setAccount]=useState(''),[contract,setContract]=useState(null),[provider,setProvider]=useState(null);
 const [tab,setTab]=useState('Communities'),[communities,setCommunities]=useState([]),[nfts,setNfts]=useState([]),[listings,setListings]=useState([]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('Connect MetaMask to use LitChat on LitVM LiteForge.');
 const [cName,setCName]=useState(''),[cDesc,setCDesc]=useState('');
 const [nName,setNName]=useState(''),[nUri,setNUri]=useState('');
 const [price,setPrice]=useState({});
 async function connect(){
  try{
   if(!window.ethereum) return setNotice('MetaMask not found. Please install MetaMask.');
   const p=new ethers.BrowserProvider(window.ethereum); await p.send('eth_requestAccounts',[]);
   try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.chainId}]})}
   catch(e){if(e.code===4902) await window.ethereum.request({method:'wallet_addEthereumChain',params:[CHAIN]}); else throw e;}
   const signer=await p.getSigner(),a=await signer.getAddress();setProvider(p);setAccount(a);
   if(addr && addr.startsWith('0x')) setContract(new ethers.Contract(addr,ABI,signer));
   setNotice(addr?'Wallet connected.':'Wallet connected — add contract address in .env to enable on-chain features.');
  }catch(e){setNotice(e.shortMessage||e.message||'Connection failed');}
 }
 async function load(){
  if(!contract)return;
  try{
   const [cc,nc,lc]=await Promise.all([contract.communityCount(),contract.nftCount(),contract.listingCount()]);
   let C=[],N=[],L=[];
   for(let i=0;i<Number(cc);i++){let x=await contract.communities(i);C.push({id:i,creator:x.creator,name:x.name,description:x.description,members:x.members.toString()});}
   for(let i=0;i<Number(nc);i++){let x=await contract.nfts(i);N.push({id:i,creator:x.creator,name:x.name,uri:x.uri});}
   for(let i=0;i<Number(lc);i++){let x=await contract.listings(i);if(x.active)L.push({id:i,nftId:Number(x.nftId),seller:x.seller,price:x.price});}
   setCommunities(C);setNfts(N);setListings(L);
  }catch(e){setNotice('Could not load contract data: '+(e.shortMessage||e.message));}
 }
 useEffect(()=>{load()},[contract]);
 async function tx(action){try{setBusy(true);setNotice('Please confirm the transaction in MetaMask…');await action();setNotice('Transaction confirmed!');await load();}catch(e){setNotice(e.shortMessage||e.reason||e.message||'Transaction failed');}finally{setBusy(false)}}
 const create=()=>tx(async()=>{if(!cName.trim())throw Error('Enter a community name');await (await contract.createCommunity(cName,cDesc)).wait();setCName('');setCDesc('');});
 const join=id=>tx(async()=>await (await contract.joinCommunity(id)).wait());
 const mint=()=>tx(async()=>{if(!nName.trim()||!nUri.trim())throw Error('Enter NFT name and image/metadata URL');await (await contract.mintNFT(nName,nUri)).wait();setNName('');setNUri('');});
 const list=id=>tx(async()=>{if(!price[id]||Number(price[id])<=0)throw Error('Enter a price in zkLTC');await (await contract.listNFT(id,ethers.parseEther(price[id]))).wait();});
 const buy=id=>tx(async()=>{let l=listings.find(x=>x.id===id);await (await contract.buyNFT(id,{value:l.price})).wait();});
 const cancel=id=>tx(async()=>await (await contract.cancelListing(id)).wait());
 return <div className="app"><header><div className="brand"><div className="logo"><MessageCircle/></div><span>Lit<span className="accent">Chat</span></span><small>COMMUNITY · COLLECT · TRADE</small></div><nav>{['Communities','NFT Studio','Marketplace'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t==='Communities'?<Users/>:t==='NFT Studio'?<ImagePlus/>:<Store/>}{t}</button>)}</nav><button className="wallet" onClick={connect}><Wallet size={17}/>{account?short(account):'Connect Wallet'}</button></header>
 <div className="hero"><div className="eyebrow"><span className="pulse"/> BUILT ON LITVM LITEFORGE</div><h1>Where communities<br/><em>become culture.</em></h1><p>Gather around ideas. Create digital collectibles. Trade on-chain.</p><div className="hero-actions"><button className="primary" onClick={()=>setTab('Communities')}>Explore communities <ArrowUpRight size={16}/></button><button className="ghost" onClick={()=>setTab('NFT Studio')}>Create an NFT <Plus size={16}/></button></div><div className="stats"><div><b>{communities.length}</b><span>Communities</span></div><div><b>{nfts.length}</b><span>Collectibles</span></div><div><b>{listings.length}</b><span>Listed items</span></div></div></div>
 <div className="notice">{notice}</div>
 <main><div className="section-head"><div><div className="eyebrow">EXPLORE LITCHAT</div><h2>{tab}</h2></div><button className="refresh" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
 {tab==='Communities'&&<><div className="create-box"><div className="box-title"><Plus/><b>Create a community</b><span>ON-CHAIN</span></div><div className="fields"><input value={cName} onChange={e=>setCName(e.target.value)} placeholder="Community name"/><input value={cDesc} onChange={e=>setCDesc(e.target.value)} placeholder="Short description (optional)"/><button className="primary" disabled={!contract||busy} onClick={create}>Create <ArrowUpRight size={15}/></button></div></div><div className="cards">{communities.map(c=><article className="tile" key={c.id}><div className="tile-icon"><Users/></div><h3>{c.name}</h3><p>{c.description||'A community on LitChat.'}</p><div className="tile-foot"><span>{c.members} members</span><button onClick={()=>join(c.id)} disabled={!contract||busy}>Join <ArrowUpRight size={14}/></button></div></article>)}</div>{!communities.length&&<div className="empty">No communities yet. Be the first to create one ✦</div>}</>}
 {tab==='NFT Studio'&&<div className="create-box studio"><div className="box-title"><ImagePlus/><b>Mint your collectible</b><span>TESTNET</span></div><label>NFT name</label><input value={nName} onChange={e=>setNName(e.target.value)} placeholder="e.g. LitVM Genesis #01"/><label>Image or metadata URL</label><input value={nUri} onChange={e=>setNUri(e.target.value)} placeholder="https://... or ipfs://..."/><p className="hint">Upload your artwork to IPFS first, then paste its URI. This MVP stores the URI on-chain.</p><button className="primary" disabled={!contract||busy} onClick={mint}>Mint NFT <Plus size={16}/></button></div>}
 {tab==='Marketplace'&&<div className="cards">{listings.map(l=>{let n=nfts.find(x=>x.id===l.nftId);return <article className="tile nft" key={l.id}><div className="art">{n?.uri?<img src={n.uri} alt={n.name} onError={e=>e.currentTarget.style.display='none'}/>:<ImagePlus/>}</div><h3>{n?.name||`Collectible #${l.nftId}`}</h3><p>Seller {short(l.seller)}</p><div className="tile-foot"><b>{ethers.formatEther(l.price)} zkLTC</b><button disabled={!contract||busy||l.seller.toLowerCase()===account.toLowerCase()} onClick={()=>buy(l.id)}>Buy</button>{l.seller.toLowerCase()===account.toLowerCase()&&<button className="cancel" onClick={()=>cancel(l.id)}>Cancel</button>}</div></article>})}</div>}
 {tab==='Marketplace'&&!listings.length&&<div className="empty">Nothing listed yet. Mint an NFT, then list it for sale.</div>}
 {tab!=='Marketplace'&&tab!=='Communities'&&<div className="cards">{nfts.map(n=><article className="tile nft" key={n.id}><div className="art">{n.uri?<img src={n.uri} alt={n.name}/>:<ImagePlus/>}</div><h3>{n.name}</h3><p>Creator {short(n.creator)}</p><div className="tile-foot"><input className="price-input" placeholder="Price zkLTC" value={price[n.id]||''} onChange={e=>setPrice({...price,[n.id]:e.target.value})}/><button disabled={!contract||busy||n.creator.toLowerCase()!==account.toLowerCase()} onClick={()=>list(n.id)}>List for sale</button></div></article>)}</div>}
 </main><footer><div className="brand mini"><div className="logo"><MessageCircle/></div><span>Lit<span className="accent">Chat</span></span></div><span>Experimental dApp · LitVM LiteForge Testnet</span><a href="https://liteforge.explorer.caldera.xyz" target="_blank">Explorer <Globe size={14}/></a></footer></div>
}
createRoot(document.getElementById('root')).render(<App/>);
