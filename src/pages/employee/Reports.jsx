import { useState } from "react"

const PRIMARY = "#122C41"
const ACCENT  = "#1e88e5"
const FONT    = "'Inter','Segoe UI',sans-serif"

const Icon = ({ d, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const ic = {
  folder : "M3 7h5l2 3h11v9a2 2 0 0 1-2 2H3z",
  file   : "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  chevR  : "M9 18l6-6-6-6",
  chevD  : "M6 9l6 6 6-6"
}

/* Fake backend data */
const REPORTS = [
{
  name:"Sales",
  files:[
    {name:"Domestic Sales Report", size:"18 kB"},
    {name:"Export Sales Report", size:"24 kB"},
    {name:"Regional Sales Report", size:"21 kB"}
  ]
},
{
  name:"Enquiry",
  files:[
    {name:"Monthly Enquiry Summary", size:"14 kB"},
    {name:"Pending Enquiries", size:"11 kB"}
  ]
},
{
  name:"Order Booking",
  files:[
    {name:"Quarterly Order Register", size:"22 kB"}
  ]
}
]

export default function Reports(){

const [open,setOpen] = useState({})
const [selectedFolder,setSelectedFolder] = useState(null)
const [selectedFile,setSelectedFile] = useState(null)

const toggle = name=>{
 setOpen(p=>({...p,[name]:!p[name]}))
 setSelectedFolder(name)
}

return (

<div style={{fontFamily:FONT}}>

<style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}
.row:hover{background:#f0f5ff;cursor:pointer}
`}</style>

{/* HEADER */}
<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:16
}}>
<h1 style={{margin:0,fontSize:26,color:PRIMARY}}>Reports (12)</h1>

<button style={{
background:PRIMARY,
color:"#fff",
border:"none",
padding:"10px 20px",
borderRadius:8,
fontWeight:600,
cursor:"pointer"
}}>
Add New Report
</button>
</div>

{/* SEARCH */}
<div style={{
background:"#fff",
padding:12,
borderRadius:10,
border:"1px solid #e5e7eb",
marginBottom:14
}}>
<input
placeholder="Search"
style={{
width:"100%",
border:"none",
outline:"none",
fontSize:14,
fontFamily:FONT
}}
/>
</div>

{/* MAIN GRID */}
<div style={{
display:"grid",
gridTemplateColumns:"260px 320px 1fr",
height:"65vh",
background:"#fff",
border:"1px solid #e5e7eb",
borderRadius:12,
overflow:"hidden"
}}>

{/* LEFT PANEL - FOLDERS */}
<div style={{borderRight:"1px solid #e5e7eb",overflowY:"auto"}}>

<div style={{padding:14,fontWeight:600,color:"#6b7280"}}>
All Reports
</div>

{REPORTS.map(f=>(
<div key={f.name}>

<div
className="row"
onClick={()=>toggle(f.name)}
style={{
display:"flex",
alignItems:"center",
gap:8,
padding:"10px 14px",
fontSize:14
}}>

<Icon d={open[f.name]?ic.chevD:ic.chevR} size={14} color="#6b7280"/>
<Icon d={ic.folder} size={16} color="#6b7280"/>

{f.name}

</div>

{open[f.name] && f.files.map(file=>(
<div
key={file.name}
className="row"
onClick={()=>setSelectedFile(file)}
style={{
padding:"8px 40px",
fontSize:13,
color:"#374151"
}}>
{file.name}
</div>
))}

</div>
))}

</div>

{/* CENTER PANEL - FILE LIST */}

<div style={{borderRight:"1px solid #e5e7eb",overflowY:"auto"}}>

<div style={{
padding:14,
fontWeight:600,
color:"#6b7280"
}}>
{selectedFolder || "Select Folder"}
</div>

{REPORTS.find(f=>f.name===selectedFolder)?.files?.map(file=>(

<div
key={file.name}
onClick={()=>setSelectedFile(file)}
className="row"
style={{
display:"flex",
alignItems:"center",
gap:10,
padding:"10px 14px",
borderTop:"1px solid #f3f4f6"
}}>

<Icon d={ic.file} size={16} color="#6b7280"/>

<div style={{flex:1,fontSize:13}}>
{file.name}
</div>

</div>

))}

</div>

{/* RIGHT PANEL - PREVIEW */}

<div style={{
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
gap:16,
padding:20
}}>

<div style={{fontSize:13,color:"#6b7280"}}>
{selectedFile ? `${selectedFile.name} ~ ${selectedFile.size}` : "No document selected"}
</div>

<div style={{
width:"70%",
height:300,
background:"#e5e7eb",
borderRadius:10,
display:"flex",
alignItems:"center",
justifyContent:"center",
color:"#6b7280",
fontSize:14
}}>
Document Preview
</div>

{selectedFile && (

<button style={{
border:"1px solid #d1d5db",
padding:"8px 20px",
borderRadius:8,
background:"#fff",
cursor:"pointer",
fontWeight:500
}}>
Download
</button>

)}

</div>

</div>

</div>
)
}