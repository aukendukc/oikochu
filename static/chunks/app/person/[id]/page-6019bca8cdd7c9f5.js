(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[162],{319:function(e,s,l){Promise.resolve().then(l.bind(l,6875))},6875:function(e,s,l){"use strict";l.d(s,{default:function(){return d}});var n=l(7437),r=l(2265),o=l(6463),c=l(666),t=l(6848),a=l(6504);function d(e){let{id:s}=e,{user:l,loading:d}=(0,c.a)(),i=(0,o.useRouter)(),[u,x]=(0,r.useState)(null),[h,b]=(0,r.useState)(null);return((0,r.useEffect)(()=>{s?(console.log("Person page: ID from params:",s),b(s)):(console.error("Person page: Missing ID in params"),x("IDが指定されていません"))},[s]),(0,r.useEffect)(()=>{d||l||(console.log("Person page: No authenticated user, redirecting to home"),i.push("/"))},[l,d,i]),d)?(0,n.jsxs)("div",{className:"min-h-screen bg-gray-100 flex flex-col",children:[(0,n.jsx)(a.Z,{}),(0,n.jsxs)("div",{className:"flex-1 flex justify-center items-center",children:[(0,n.jsx)("div",{className:"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"}),(0,n.jsx)("span",{className:"ml-3",children:"認証情報を確認中..."})]})]}):l?u?(0,n.jsxs)("div",{className:"min-h-screen bg-gray-100 flex flex-col",children:[(0,n.jsx)(a.Z,{}),(0,n.jsx)("div",{className:"container mx-auto p-4 flex-1",children:(0,n.jsxs)("div",{className:"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded",children:[(0,n.jsx)("p",{className:"font-bold",children:"エラー"}),(0,n.jsx)("p",{children:u}),(0,n.jsx)("button",{className:"mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",onClick:()=>i.push("/"),children:"マップに戻る"})]})})]}):(0,n.jsxs)("div",{className:"min-h-screen bg-gray-100 flex flex-col",children:[(0,n.jsx)(a.Z,{}),(0,n.jsx)("div",{className:"flex-1 pt-4",children:h?(0,n.jsx)(t.Z,{personId:h}):(0,n.jsx)("div",{className:"container mx-auto p-4",children:(0,n.jsxs)("div",{className:"bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded",children:[(0,n.jsx)("p",{children:"IDが設定されていません。マップに戻ってください。"}),(0,n.jsx)("button",{className:"mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",onClick:()=>i.push("/"),children:"マップに戻る"})]})})})]}):null}}},function(e){e.O(0,[358,139,141,252,452,681,971,23,744],function(){return e(e.s=319)}),_N_E=e.O()}]);