import { useSignal }  from '@tp/preact/signals.mjs';
import { html }       from '@tp/preact/htm_preact.mjs';

export default function PanelSection( { title, children, defaultOpen=true } ){
    const isOpen = useSignal( defaultOpen );

    return html `
        <section class='panelSection'>
            <header onClick=${() => isOpen.value = !isOpen.value}>
                <span>${ isOpen.value? '-': '+'}</span>${title}
            </header>
            <main>${ isOpen.value? children : null }</main>
        </section>
    `;
}
