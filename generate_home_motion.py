"""Generate small, original brand motion graphics and matching accessible stills.


Run with python generate_home_motion.py. Requires Pillow. No external assets.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / 'src/assets/img/motion'
OUT.mkdir(parents=True, exist_ok=True)
NAVY, RED, LINE, BG = '#102448', '#d9082c', '#dce4ef', '#f5f8fc'
S = 2

def frame(kind, t):
    image = Image.new('RGB', (400*S, 200*S), BG)
    d = ImageDraw.Draw(image)
    def line(points, color=LINE, width=2):
        d.line([(round(x*S), round(y*S)) for x,y in points], fill=color, width=width*S, joint='curve')
    def circle(x,y,r,color,outline=None):
        d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill=color,outline=outline,width=2*S)
    if kind == 'cardiac-pulse':
        for x in range(20,400,20): line([(x,35),(x,165)], '#eaf0f7',1)
        for y in range(40,180,20): line([(20,y),(380,y)], '#eaf0f7',1)
        points=[(20,108),(125,108),(144,92),(160,124),(180,50),(201,154),(219,85),(235,108),(380,108)]
        line(points,'#e5b6c1',2)
        lengths=[math.dist(a,b) for a,b in zip(points,points[1:])]
        total=sum(lengths)
        for offset in range(20):
            pos=((t-offset*.009)%1)*total
            for a,b,length in zip(points,points[1:],lengths):
                if pos <= length:
                    p=pos/length
                    circle(a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p,2.5,RED if offset<13 else '#e5a1b0')
                    break
                pos-=length
    elif kind == 'clear-plan':
        d.rounded_rectangle((128*S,22*S,277*S,179*S),radius=12*S,fill='#e9eef6')
        d.rounded_rectangle((122*S,16*S,271*S,173*S),radius=12*S,fill='white',outline=LINE,width=2*S)
        d.rounded_rectangle((165*S,10*S,228*S,30*S),radius=6*S,fill=NAVY)
        for i in range(3):
            y=60+i*37
            circle(149,y,10,'#fff1f3')
            progress=min(1,max(0,(t-i*.17)*4))
            tick=[(144,y),(148,y+4),(155,y-4)]
            if progress>.2: line(tick[:2],RED,2)
            if progress>.65: line(tick,RED,2)
            line([(174,y-3),(247,y-3)],NAVY,3)
            line([(174,y+6),(224,y+6)],LINE,2)
    else:
        nodes=[(73,109),(195,64),(322,109)]
        line(nodes,LINE,3)
        for i,(x,y) in enumerate(nodes):
            circle(x,y,28,'white',LINE)
            circle(x,y,20,'#fff1f3' if i!=1 else NAVY)
        line([(65,110),(70,115),(81,102)],RED,3)
        line([(187,57),(203,57),(203,72),(187,72),(187,57)],'white',2)
        line([(191,53),(191,61)],'white',2)
        line([(199,53),(199,61)],'white',2)
        line([(312,110),(322,101),(332,110),(329,110),(329,120),(315,120),(315,110)],RED,2)
        segment=min(int(t*2),1); p=t*2-segment
        a,b=nodes[segment],nodes[segment+1]
        x,y=a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p
        circle(x,y,6,RED)
        for i,(x,y) in enumerate(nodes): line([(x-21,151),(x+21,151)],LINE,3)
    return image.resize((400,200),Image.Resampling.LANCZOS)

for name in ('cardiac-pulse','clear-plan','connected-care'):
    frames=[frame(name,i/40) for i in range(40)]
    # A shared palette keeps the loops visually stable and compresses efficiently.
    palette=frames[20].quantize(colors=96)
    indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    indexed[0].save(OUT/(name+'.gif'),save_all=True,append_images=indexed[1:],duration=60,loop=0,optimize=True,disposal=2)
    frames[30].save(OUT/(name+'.png'),optimize=True)
    print(name, (OUT/(name+'.gif')).stat().st_size, 'bytes')



