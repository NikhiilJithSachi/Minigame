import glob,os
src=os.path.dirname(os.path.abspath(__file__))+"/src/"
js="(()=>{\n"+"\n".join(open(f).read() for f in sorted(glob.glob(src+"[0-9]-*.js")))+"\n})();"
page=open(src+"shell.html").read().replace("/*__JS__*/",js)
os.makedirs("public",exist_ok=True)

RESET="html,body{margin:0}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box;height:100%}"
full='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="theme-color" content="#0D0A26"><style>'+RESET+'</style></head><body>'+page+'</body></html>'
open("public/index.html","w").write(full)
print(len(page))
