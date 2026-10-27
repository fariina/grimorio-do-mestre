import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){
 await requireChatGPTUser('/');
 return <>
  <link rel="stylesheet" href="/style.css"/><link rel="stylesheet" href="/integration.css"/>
  <a className="skip" href="#content">Pular para o conteúdo</a>
  <div id="app"><div className="boot">Abrindo seu grimório…</div></div>
  <div id="toasts" role="status" aria-live="polite"/><dialog id="modal"/><dialog id="reader"/>
  <script type="module" src="/app.js"/>
 </>;
}
