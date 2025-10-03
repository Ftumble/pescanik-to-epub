const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs');
const admzip = require('adm-zip');

const custumdate = false

const today = new Date(custumdate ? Date.parse('2025-9-29') : Date.now());
const tocncx = 
`
<?xml version='1.0' encoding='utf-8'?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="eng">
  <head>
    <meta name="dtb:uid" content="1b26e289-f393-4fa4-a7cc-c74434428e5e"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:generator" content="calibre (8.10.0)"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>|<>|</text>
  </docTitle>
  <navMap>
    <navPoint id="uPAUCsBZWK7jkMWOChhaRiD" playOrder="1">
      <navLabel>
        <text>Start</text>
      </navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>
  </navMap>
</ncx>
`
const pagefile = `
<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Converted Ebook</title>
    <meta content="PDF Reflow conversion" name="generator"/>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
<link rel="stylesheet" type="text/css" href="page_styles.css"/>
</head>
  <body class="calibre">
  |<>|
</body>
</html>
`
const contentopf = `
<?xml version="1.0"  encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uuid_id">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:calibre="http://calibre.kovidgoyal.net/2009/metadata">
    <dc:title>naslov</dc:title>
    <dc:creator opf:role="aut" opf:file-as="autor">autor</dc:creator>
    <dc:contributor opf:role="bkp">calibre (8.10.0) [https://calibre-ebook.com]</dc:contributor>
    <dc:date>0101-01-01T00:00:00+00:00</dc:date>
    <dc:identifier id="uuid_id" opf:scheme="uuid">1b26e289-f393-4fa4-a7cc-c74434428e5e</dc:identifier>
    <dc:language>en</dc:language>
    <dc:identifier opf:scheme="calibre">1b26e289-f393-4fa4-a7cc-c74434428e5e</dc:identifier>
    <meta name="calibre:title_sort" content="naslov"/>
    <meta name="calibre:timestamp" content="2025-09-24T22:46:40.121833+00:00"/>
    <meta name="cover" content="cover"/>
  </metadata>
  <manifest>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    <item id="txt" href="txt.html" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="page_css" href="page_styles.css" media-type="text/css"/>
    <item id="css" href="stylesheet.css" media-type="text/css"/>
    <item id="cover" href="cover.jpeg" media-type="image/jpeg"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="titlepage"/>
    <itemref idref="txt"/>
  </spine>
  <guide>
    <reference type="cover" href="titlepage.xhtml" title="Cover"/>
  </guide>
</package>
`
const titlepage = `
<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <meta name="calibre:cover" content="true"/>
        <title>Cover</title>
        <style type="text/css" title="override_css">
            @page {padding: 0pt; margin:0pt}
            body { text-align: center; padding:0pt; margin: 0pt; }
        </style>
    </head>
    <body>
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 470 758" preserveAspectRatio="none">
                <image width="470" height="758" xlink:href="cover.|<>|"/>
            </svg>
        </div>
    </body>
</html>

`
start();

async function start() {
  console.log("ucitavam 'https://pescanik.net/'...");
  
  const resp = await axios.get('https://pescanik.net/')

  console.log('sajt ucitan! pripremam clanke...');
  
  if (resp.status == 200) {
    const html = resp.data;
    const $ = cheerio.load(html);
      
    const htmlClanci = $('article');
    var flag = false;
    
    htmlClanci.each(function(i, elem) {
      const datum = elem.attribs['data-date']
      //console.log(today.getDate(), Date.parse(datum), datum);
      
      try {
      if (new Date(datum).getDate() == today.getDate() &&
          new Date(datum).getMonth() == today.getMonth() &&
          new Date(datum).getFullYear() == today.getFullYear()) {
        flag = true;
        const title = elem.attribs['data-name'];
        const donjiDeo = $('article:eq(' + i + ')').find('.post-entry-content');
        const link = donjiDeo.find('.entry-title').find('a')[0].attribs['href'];
        console.log(link, title);
        
        const slika = $('article:eq(' + i + ')').find('.preload-me')[0].attribs['src'];
        const autor = donjiDeo.find('.entry-meta').find('a').text();

        tekst({
          title: title,
          slika: slika,
          link: link,
          autor: autor
        })
      }
      } catch {
        console.log('greska sa clankom!');
        
      }
    })

  }
    if (!flag) console.log('za danas jos nema clanaka 🙁');
}

async function tekst(element) {
    const fullnaziv = `${element.title}, ${element.autor}`;
    const dirname =  './' + fullnaziv
    .replaceAll('?', '(1)')
    .replaceAll('/', '(2)')
    .replaceAll('\\', '(3)')
    .replaceAll('*', '(4)')
    .replaceAll(':', '(5)')
    .replaceAll('"', '(6)')
    .replaceAll('<', '(7)')
    .replaceAll('>', '(8)')
    .replaceAll('|', '(9)')
  console.log('ucitavam clanak ' + fullnaziv + '...');
  
  const resp_inn = await axios.get(element.link);
  const $ = cheerio.load(resp_inn.data);

  console.log('clanak ' + fullnaziv + ' ucitan!');
  
  if (resp_inn.status == 200) {
    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname)
    if (!fs.existsSync(dirname + '/META-INF')) fs.mkdirSync(dirname + '/META-INF')
    

    var tocncxloc = tocncx.replace('|<>|', fullnaziv);
    console.log('upisujem toc.ncx fajl za ' + fullnaziv + '...');
    fs.writeFileSync(`${dirname}/toc.ncx`, tocncxloc);

    console.log('prepisujem mimetype za ' + fullnaziv + '...')
    fs.copyFileSync('./essentials/mimetype', dirname + '/mimetype');
    
    console.log('prepisujem page_styles.css za ' + fullnaziv + '...')
    fs.copyFileSync('./essentials/page_styles.css', dirname + '/page_styles.css');
    
    console.log('prepisujem stylesheet.css za ' + fullnaziv + '...')
    fs.copyFileSync('./essentials/stylesheet.css', dirname + '/stylesheet.css');

    console.log('prepisujem container.xml za ' + fullnaziv + '...')
    fs.copyFileSync('./essentials/container.xml', dirname + '/META-INF/container.xml');

    console.log('formatiram html fajl za ' + fullnaziv + '...');
    
    var tekst_html = `<h2 id="page_1" class="calibre1"><span class="calibre2">${fullnaziv}</span></h2>`;

    $('.entry-content > *').each(function (i, elem) {
      if (elem.name == 'p') {
        tekst_html += `<p class=calibre4>${$(elem).html()}</p>`
      } else if (elem.name == 'h4') {
        tekst_html += `<h3 class="calibre5">${$(elem).html()}</h3>`
      }
    })

    console.log('upisujem html  za ' + fullnaziv + '...');
    
    fs.writeFileSync(dirname + '/txt.html', pagefile.replace('|<>|', tekst_html));

    console.log('upisujem content.opf fajl  za ' + fullnaziv + '...');
    
    var contentopfloc = contentopf.replaceAll('autor', element.autor).replaceAll('naslov', element.title);

    fs.writeFileSync(dirname + '/content.opf', contentopfloc);

    console.log('ucitavam sliku za fajl ' + fullnaziv + '...');
    
    const resp = await fetch(element.slika);
    const blob = await resp.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    fs.writeFileSync(dirname + '/titlepage.xhtml', titlepage.replaceAll('|<>|', element.slika.split('.')[2]));
    fs.writeFileSync(dirname + '/cover.' + element.slika.split('.')[2], buffer);

    console.log('folder ' + fullnaziv + ' gotov! zipovanje je u toku...');
    
    if (!fs.existsSync('./pescanik')) fs.mkdirSync('./pescanik');

    const zip = new admzip();
    zip.addLocalFolder(dirname);
    zip.writeZip('pescanik/' + dirname + '.epub')

    console.log('gotovo zipovanje! brisanje foldera ' + fullnaziv + '...');
    fs.rmSync(dirname, { recursive: true, force: true })
    

    console.log('gotovo!');
    
    
  }
}