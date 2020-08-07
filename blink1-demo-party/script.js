
// Part of https://todbot.github.io/blink1-webhid/

document.getElementById('start-button').addEventListener('click', handleClick);
document.getElementById('stop-button').addEventListener('click', handleClickStop);

let timer;

async function handleClickStop() {
    clearTimeout(timer);
    timer = null;
    const device = await openDevice();
    await fadeToColor(device, [0,0,0], 100, 0);
}

async function handleClick() {
    if(timer) return;
    startParty();
}

async function startParty() {
    let acolor = randColor();
    const ledn = 1 + Math.floor(Math.random()*2);
    const fadeMillis = 100;
    const device = await openDevice();
    await fadeToColor(device, acolor, fadeMillis, ledn );
    timer = setTimeout(startParty, 200, ledn);
}

async function openDevice() {
    const vendorId = 0x27b8; // blink1 vid
    const productId = 0x01ed;  // blink1 pid

    const device_list = await navigator.hid.getDevices();

    let device = device_list.find(d => d.vendorId === vendorId && d.productId === productId);

    if (!device) {
        // this returns an array now
        let devices = await navigator.hid.requestDevice({
            filters: [{ vendorId, productId }],
        });
        console.log("devices:",devices);
        device = devices[0];
        if( !device ) return null;
    }

    if (!device.opened) {
        await device.open();
    }
    console.log("device opened:",device);
    return device;
}

async function fadeToColor(device, [r, g, b], fadeMillis, ledn ) {
    const reportId = 1;

    const dmsh = (fadeMillis/10) >> 8;
    const dmsl = (fadeMillis/10) % 0xff;
    console.log(`fadeToColor: ${r},${g},${b} ledn:${ledn} dmsh:${dmsh} dmsl:${dmsl}`);

    // NOTE: do not put reportId in data array (at least on MacOS),
    //  and array must be exactly REPORT_COUNT big (8 bytes in this case)
    const data = Uint8Array.from([0x63, r, g, b, dmsh, dmsl, ledn, 0x00]);
    try {
        await device.sendFeatureReport(reportId, data);
    } catch (error) {
        console.error('fadeToColor: failed:', error);
    }
}

function randColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return [r,g,b];
}
