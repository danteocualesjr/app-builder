import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local Cursor App Builder",
  description: "Build local web apps with Cursor SDK and live preview",
};

// #region debug hydration instrumentation
const DEBUG_HYDRATION_SCRIPT = `
(function(){
  var ENDPOINT='http://127.0.0.1:7389/ingest/bc680c2e-7a32-439e-b722-ea9d204aa6da';
  var SID='101125';
  function send(payload){
    try {
      fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Debug-Session-Id':SID},
        body:JSON.stringify(payload)
      }).catch(function(){});
    } catch(e){}
  }
  function dumpAttrs(el){
    var out={};
    if (!el) return out;
    for (var i=0;i<el.attributes.length;i++){
      out[el.attributes[i].name]=el.attributes[i].value;
    }
    return out;
  }
  function snapshot(when){
    send({
      sessionId:SID,
      location:'layout.tsx:body-snapshot',
      message:'body+html attribute snapshot at '+when,
      data:{
        when:when,
        bodyAttrs:dumpAttrs(document.body),
        htmlAttrs:dumpAttrs(document.documentElement),
        grShadowPresent:!!document.querySelector('[data-grammarly-shadow-root]'),
        windowGrammarlyType:typeof window.grammarly,
        readyState:document.readyState,
        uaSnippet:(navigator.userAgent||'').slice(0,200)
      },
      hypothesisId:'H1+H2+H4+H5',
      timestamp:Date.now()
    });
  }
  function checkSSR(){
    try {
      fetch(window.location.href,{cache:'no-store'}).then(function(r){return r.text();}).then(function(html){
        var bodyTagMatch = html.match(/<body[^>]*>/i);
        send({
          sessionId:SID,
          location:'layout.tsx:ssr-html',
          message:'raw SSR HTML scan for data-gr/data-new-gr',
          data:{
            containsDataGr:html.indexOf('data-gr')>-1,
            containsDataNewGr:html.indexOf('data-new-gr')>-1,
            bodyOpeningTag:(bodyTagMatch?bodyTagMatch[0]:'<no body tag found>').slice(0,400),
            htmlLength:html.length
          },
          hypothesisId:'H3',
          timestamp:Date.now()
        });
      }).catch(function(){});
    } catch(e){}
  }
  if (document.readyState !== 'loading') { snapshot('script-immediate'); }
  document.addEventListener('DOMContentLoaded', function(){ snapshot('DOMContentLoaded'); });
  window.addEventListener('load', function(){
    snapshot('load');
    checkSSR();
    setTimeout(function(){ snapshot('load+1500ms'); }, 1500);
  });
})();
`;
// #endregion

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* #region debug hydration instrumentation */}
        <script
          dangerouslySetInnerHTML={{ __html: DEBUG_HYDRATION_SCRIPT }}
        />
        {/* #endregion */}
      </body>
    </html>
  );
}
