import{c as U,i as P,_ as q}from"./loader.26211ad3.js";import{_ as z,o as l,c as a,F as _,r as m,w as D,n as $,t as u,a as y,b as e,d as w,v as F,e as f,f as v,g as j,h as k,i as S}from"./index.e39243e2.js";const V={name:"Pagination",props:{limit:{type:Number},lastPage:{type:Number},currentPage:{type:Number}},computed:{pageRange(){if(this.limit===-1)return 0;if(this.limit===0)return this.lastPage;let t=this.currentPage,o=this.lastPage,b=this.limit,d=t-b,g=t+b+1,r=[],n=[],h;for(let c=1;c<=o;c++)(c===1||c===o||c>=d&&c<g)&&r.push(c);return r.forEach(function(c){h&&(c-h===2?n.push(h+1):c-h!==1&&n.push("...")),n.push(c),h=c}),n}}},M={class:"flex flex-wrap lg:justify-end my-8"},B=["onClick"];function T(t,o,b,d,g,r){return l(),a("div",M,[(l(!0),a(_,null,m(r.pageRange,n=>(l(),a("a",{href:"#",onClick:D(h=>t.$emit("changePage",n),["prevent"]),class:$(["w-10 h-10 flex items-center justify-center flex-shrink-0 hover:bg-primary hover:text-white",n===b.currentPage&&"bg-primary text-white"])},u(n),11,B))),256))])}const N=z(V,[["render",T]]);function C(t,o,b){var d,g,r,n,h;o==null&&(o=100);function c(){var s=Date.now()-n;s<o&&s>=0?d=setTimeout(c,o-s):(d=null,b||(h=t.apply(r,g),r=g=null))}var x=function(){r=this,g=arguments,n=Date.now();var s=b&&!d;return d||(d=setTimeout(c,o)),s&&(h=t.apply(r,g),r=g=null),h};return x.clear=function(){d&&(clearTimeout(d),d=null)},x.flush=function(){d&&(h=t.apply(r,g),r=g=null,clearTimeout(d),d=null)},x}C.debounce=C;var A=C;const L=A,I={name:"Projects",components:{CheckSvg:U,pagination:N},data:()=>({modalShow:!1,loader:!0,sidebarData:{technologies:[],categories:[],apis:[],tags:[]},filter_data:{technologies:{queryString:"projecttechnology__technology__name__in",arr:[]},apis:{queryString:"projectapi__api__name__in",arr:[]},categories:{queryString:"projectcategory__category__name__in",arr:[]},tags:{queryString:"projecttag__tag__name__in",arr:[]}},search:"",projects:[],total_project:0,page_size:10,current_page:1}),computed:{serverSideQueryString(){let t="";for(let o in this.filter_data)this.filter_data[o].arr.length&&(t+=`${this.filter_data[o].queryString}=${this.filter_data[o].arr.toString()}&`);return t}},methods:{fetchProjects(){this.loader=!0,P.get(`/portfolio/projects/?search=${this.search}&${this.serverSideQueryString}&page=${this.current_page}&page_size=${this.page_size}`).then(t=>{this.projects=t.data.results,this.total_project=t.data.count}).finally(()=>{this.loader=!1})},changePage(t){this.current_page=t,this.generateUrl(),this.fetchProjects()},generateUrl(){this.$router.replace({name:"projects",query:{search:this.search,technologies:this.filter_data.technologies.arr.toString(),categories:this.filter_data.categories.arr.toString(),apis:this.filter_data.apis.arr.toString(),tags:this.filter_data.tags.arr.toString(),page:this.current_page,page_size:this.page_size}}),this.debounceCheckboxFetch(this)},debounceCheckboxFetch:L(t=>{t.fetchProjects()},1e3),presetFilter(){this.filter_data.apis.arr=this.$route.query.apis?this.$route.query.apis.split(","):[],this.filter_data.categories.arr=this.$route.query.categories?this.$route.query.categories.split(","):[],this.filter_data.tags.arr=this.$route.query.tags?this.$route.query.tags.split(","):[],this.filter_data.technologies.arr=this.$route.query.technologies?this.$route.query.technologies.split(","):[],this.current_page=this.$route.query.page?parseInt(this.$route.query.page):this.current_page,this.page_size=this.$route.query.page_size?parseInt(this.$route.query.page_size):this.page_size,this.search=this.$route.query.search?this.$route.query.search:this.search}},mounted(){P.get("/portfolio/sidebar-utils/").then(({data:t})=>{this.sidebarData.technologies=t.technologies,this.sidebarData.categories=t.categories,this.sidebarData.apis=t.apis,this.sidebarData.tags=t.tags,this.presetFilter(),document.title=`Projects - ${this.filter_data.technologies.arr.length>0?"Developed in="+this.filter_data.technologies.arr.toString():""} - by K M Rifat ul Alom`}).finally(t=>{this.fetchProjects()})}},R={class:"container mx-auto px-3"},E={class:"bg-[#F9F9F9] p-5 sm:p-10 mb-10 flex flex-col items-center"},Q=e("h3",{class:"text-xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-10"},"Search and find",-1),K=e("button",{class:"bg-primary text-base sm:text-xl md:py-4 px-4 sm:px-8 md:px-12 text-white rounded-lg"},"Search ",-1),G=e("div",{class:"flex flex-col sm:flex-row sm:items-center gap-3 mt-5 sm:mt-10"},null,-1),H={class:"container mx-auto px-3"},J={key:0,class:"flex items-center justify-center"},O=e("img",{src:q,alt:""},null,-1),W=[O],X={key:1},Y={class:"flex gap-10 flex-wrap"},Z={class:"lg:border rounded-lg overflow-hidden"},ee={class:"bg-white px-6 lg:px-10 py-5 flex justify-between font-semibold mb-3 relative"},te=e("p",null,"Filter",-1),se=e("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-6 h-6"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"})],-1),oe=e("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"red",class:"w-6 h-6"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})],-1),re=[oe],le={class:"px-6 lg:px-10 overflow-y-auto sidebar-scrollbar"},ae={class:"mb-8"},ie=e("div",{class:"text-lg mb-4"},"Technology",-1),ne={class:"flex gap-4 flex-col overflow-y-auto sidebar-scrollbar"},ce={class:"flex gap-5"},de=["id","value"],he=["for"],ue={class:"mb-8"},ge=e("div",{class:"text-lg mb-4"},"Category",-1),pe={class:"flex gap-4 flex-col overflow-y-auto sidebar-scrollbar"},fe={class:"flex gap-5"},_e=["id","value"],me=["for"],be={class:"mb-8"},ve=e("div",{class:"text-lg mb-4"},"API",-1),xe={class:"flex gap-4 flex-col overflow-y-auto sidebar-scrollbar"},we={class:"flex gap-5"},ye=["id","value"],ke=["for"],$e={class:"mb-8"},Se=e("div",{class:"text-lg mb-4"},"Tag",-1),Ce={class:"flex gap-4 flex-col overflow-y-auto sidebar-scrollbar"},Pe={class:"flex gap-5"},je=["id","value"],qe=["for"],ze={class:"lg:w-[calc(100%_-_340px)]"},De={key:0,class:"flex items-center justify-center"},Ue=e("img",{src:q,alt:""},null,-1),Fe=[Ue],Ve={class:"border rounded-lg p-3 flex flex-col sm:flex-row gap-6 mb-5"},Me=["src"],Be={class:"w-full"},Te={class:"flex items-center gap-3"},Ne={class:"shrink-0 font-semibold"},Ae={class:"flex flex-wrap gap-2"},Le={class:"border rounded-lg py-1 px-3 text-primary text-sm sm:text-base"},Ie={class:"text-[#222222] my-3"},Re=e("h6",{class:"font-semibold mb-1"},"Framework:",-1),Ee={class:"flex justify-between flex-col md:flex-row lg:flex-col xl:flex-row gap-3 xl:items-center"},Qe={class:"flex flex-wrap gap-2 lg:gap-4"},Ke={class:"flex items-center gap-1 text-sm sm:text-base"},Ge={class:"flex flex-shrink-0 gap-3 items-end"},He=e("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-4 sm:w-6 h-4 sm:h-6"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"}),e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"})],-1),Je=S(" View "),Oe=["href"],We={key:1},Xe=e("h3",null,"Project not found",-1),Ye=e("h4",null,"at",-1),Ze=e("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"#ffffff",class:"w-6 h-6"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"})],-1),et=[Ze];function tt(t,o,b,d,g,r){const n=y("perfect-scrollbar"),h=y("router-link"),c=y("check-svg"),x=y("pagination");return l(),a(_,null,[e("section",null,[e("div",R,[e("div",E,[Q,e("form",{onSubmit:o[1]||(o[1]=D((...s)=>r.generateUrl&&r.generateUrl(...s),["prevent"])),class:"border-[#BDBDBD] rounded-lg flex overflow-hidden"},[w(e("input",{type:"search","onUpdate:modelValue":o[0]||(o[0]=s=>t.search=s),class:"border-0 outline-none px-4 py-2 sm:p-4 sm:w-[440px] lg:w-[700px]"},null,512),[[F,t.search,void 0,{trim:!0}]]),K],32),G])])]),e("section",null,[e("div",H,[t.loader?(l(),a("div",J,W)):(l(),a("div",X,[e("div",Y,[e("div",{class:$(["w-[300px] bg-[#F5F5F5] border lg:border-none flex-shrink-0 lg:block fixed z-50 top-0 left-0 h-full lg:sticky lg:top-1",t.modalShow?"block":"hidden"])},[e("div",Z,[e("div",ee,[te,se,e("div",{onClick:o[2]||(o[2]=s=>t.modalShow=!t.modalShow),class:"lg:hidden absolute top-0 right-0"},re)]),f(n,{class:"max-h-[750px]"},{default:v(()=>[e("div",le,[e("div",ae,[ie,f(n,{class:"max-h-52"},{default:v(()=>[e("div",ne,[(l(!0),a(_,null,m(t.sidebarData.technologies,s=>(l(),a("div",ce,[w(e("input",{class:"w-6 h-6 focus:outline-none",id:`technology-${s.id}`,onChange:o[3]||(o[3]=(...i)=>r.generateUrl&&r.generateUrl(...i)),"onUpdate:modelValue":o[4]||(o[4]=i=>t.filter_data.technologies.arr=i),value:s.name,type:"checkbox"},null,40,de),[[k,t.filter_data.technologies.arr]]),e("label",{for:`technology-${s.id}`,class:"cursor-pointer font-normal text-base lg:text-lg"},u(s.name),9,he)]))),256))])]),_:1})]),e("div",ue,[ge,f(n,{class:"max-h-52"},{default:v(()=>[e("div",pe,[(l(!0),a(_,null,m(t.sidebarData.categories,(s,i)=>(l(),a("div",fe,[w(e("input",{class:"w-6 h-6 focus:outline-none",id:`categories-${i}`,onChange:o[5]||(o[5]=(...p)=>r.generateUrl&&r.generateUrl(...p)),"onUpdate:modelValue":o[6]||(o[6]=p=>t.filter_data.categories.arr=p),value:s.name,type:"checkbox"},null,40,_e),[[k,t.filter_data.categories.arr]]),e("label",{for:`categories-${i}`,class:"cursor-pointer font-normal text-base lg:text-lg"},u(s.name),9,me)]))),256))])]),_:1})]),e("div",be,[ve,f(n,{class:"max-h-52"},{default:v(()=>[e("div",xe,[(l(!0),a(_,null,m(t.sidebarData.apis,(s,i)=>(l(),a("div",we,[w(e("input",{class:"w-6 h-6 focus:outline-none",id:`api-${i}`,value:s.name,"onUpdate:modelValue":o[7]||(o[7]=p=>t.filter_data.apis.arr=p),onChange:o[8]||(o[8]=(...p)=>r.generateUrl&&r.generateUrl(...p)),type:"checkbox"},null,40,ye),[[k,t.filter_data.apis.arr]]),e("label",{for:`api-${i}`,class:"cursor-pointer font-normal text-base lg:text-lg"},u(s.name),9,ke)]))),256))])]),_:1})]),e("div",$e,[Se,f(n,{class:"max-h-52"},{default:v(()=>[e("div",Ce,[(l(!0),a(_,null,m(t.sidebarData.tags,(s,i)=>(l(),a("div",Pe,[w(e("input",{class:"w-6 h-6 focus:outline-none",id:`tag-${i}`,value:s.name,"onUpdate:modelValue":o[9]||(o[9]=p=>t.filter_data.tags.arr=p),onChange:o[10]||(o[10]=(...p)=>r.generateUrl&&r.generateUrl(...p)),type:"checkbox"},null,40,je),[[k,t.filter_data.tags.arr]]),e("label",{for:`tag-${i}`,class:"cursor-pointer font-normal text-base lg:text-lg"},u(s.name),9,qe)]))),256))])]),_:1})])])]),_:1})])],2),e("div",ze,[t.loader?(l(),a("div",De,Fe)):j("",!0),(l(!0),a(_,null,m(t.projects,s=>(l(),a("div",Ve,[f(h,{to:"/project/"+s.slug,class:"shrink-0 w-full sm:w-40 md:w-52 xl:w-96 h-44 md:h-56 rounded-lg overflow-hidden hover:opacity-90 transition-all"},{default:v(()=>[e("img",{class:"w-full h-full object-cover object-top",src:s.feature_image?s.feature_image:"https://placekitten.com/384/360",alt:""},null,8,Me)]),_:2},1032,["to"]),e("div",Be,[f(h,{to:"/project/"+s.slug,class:"font-semibold text-xl md:text-2xl mb-2 block"},{default:v(()=>[S(u(s.name),1)]),_:2},1032,["to"]),e("div",Te,[e("p",Ne,u(s.apis.length>0?"API:":s.categories.length>0?"Categories:":"Tags"),1),e("div",Ae,[(l(!0),a(_,null,m(s.apis.length>0?s.apis:s.categories.length>0?s.categories:s.tags,i=>(l(),a("div",Le,u(i.name),1))),256))])]),e("p",Ie,u(s.short_description),1),Re,e("div",Ee,[e("div",Qe,[(l(!0),a(_,null,m(s.technologies,i=>(l(),a("div",Ke,[f(c),S(" "+u(i.name),1)]))),256))]),e("div",Ge,[f(h,{to:"/project/"+s.slug,class:"bg-primary py-2 px-3 text-white shrink-0 flex items-center gap-2 rounded-md hover:bg-opacity-75 transition-all text-sm sm:text-base"},{default:v(()=>[He,Je]),_:2},1032,["to"]),(l(!0),a(_,null,m(s.buttons,i=>(l(),a("a",{target:"_blank",href:i.url,class:"bg-success py-2 px-3 text-white shrink-0 flex gap-2 rounded-md hover:bg-opacity-75 transition-all text-sm sm:text-base"},u(i.title),9,Oe))),256))])])])]))),256)),t.projects.length===0?(l(),a("div",We,[Xe,Ye,e("p",null,u(t.$route.fullPath),1)])):j("",!0)])]),f(x,{limit:4,"last-page":Math.ceil(t.total_project/t.page_size),"current-page":t.current_page,onChangePage:r.changePage},null,8,["last-page","current-page","onChangePage"])]))])]),e("button",{onClick:o[11]||(o[11]=s=>t.modalShow=!t.modalShow),class:"shadow-lg lg:hidden fixed bottom-7 right-7 z-20 bg-primary rounded-full p-4"},et),e("div",{onClick:o[12]||(o[12]=s=>t.modalShow=!t.modalShow),class:$([!t.modalShow&&"hidden","fixed w-full h-full left-0 top-0 bg-black bg-opacity-70 backdrop-blur-sm"])},null,2)],64)}const rt=z(I,[["render",tt]]);export{rt as default};
