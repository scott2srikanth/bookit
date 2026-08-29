"use client";import {Printer} from "lucide-react";export function PrintButton(){return <button onClick={()=>window.print()} className="primary-btn"><Printer size={16}/>Print / Save PDF</button>}
