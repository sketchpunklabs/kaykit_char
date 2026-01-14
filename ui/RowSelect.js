import { html } from '@tp/preact/htm_preact.mjs';

export default function RowSelect( { items, label="row", msg="", value=null, onChange=null } ){
    return html`
    <div class='sectionRow'>
        <header>${label}</header>
        <main style="display:grid;">
            <select value=${value} onChange=${onChange}>
                <button>
                    <selectedcontent></selectedcontent>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6"></path>
                    </svg>
                </button>

                <option value="" hidden disabled selected>${msg}</option>
                ${ Array.isArray(items)
                    ? items.map( (v,i)=>html`<option value=${i}>${v}</option>` )
                    : Object.entries(items).map( ([k,v])=>html`<option value=${v}>${k}</option>` )
                }
            </select>
        </main>
    </div>
    `;
}
