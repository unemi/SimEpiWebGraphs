#! /bin/zsh
# Weekly data of newly reported death cases
cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start
logEnd() {
	echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
}
if (echo $PATH | fgrep -q local)
then dummy=""; else PATH=/usr/local/bin:$PATH
fi
src=deaths_detail_cumulative_weekly.csv
dst=ages.csv
../updateTest/getFileIfNew.sh https://covid19.mhlw.go.jp/public/opendata/$src
if [ $? -ne 0 ]; then logEnd; exit; fi

mkPlot() {
if [ "$1" = "cum" ]; then CM="fc"; else CM="lw 2 lc"; fi
gnuplot <<EOF
set terminal svg size 700 300
if ("$1" eq "cum") {
	set style data filledcurves x1
	CS=.5; CV=1.
} else {
	set style data lines
	CS=1.; CV=.667
}
set key outside autotitle columnheader
set datafile separator comma
set ylabel "$3"
set xlabel "$4 死亡患者数年代別 週間報告数推移"
set xtics ($xmarks)
cl(x) = (x < .5)? x * 2. / 3. : (x < 5. / 8.)? x * 8. / 3. - 1. : x * 2. / 3. + 1. / 4
plot for [i = $(($2+9)):$2:-1] 'ages.csv' using 0:i $CM rgb hsv2rgb(cl((i-$2)/10.),CS,CV)
EOF
}
makeGraphs() {
local i1=$(($1*10+2))
if [ $1 -eq 2 ]; then i1=2; fi
local i2=$((i1+10))
awk -F, 'BEGIN{ttl=",10歳未満,10代,20代,30代,40代,50代,60代,70代,80代,90歳以上";
printf "日付%s%s%s%s\n", ttl, ttl, ttl, ttl}
$1 ~ /~/{split($1,dx,"~");split(dx[1],d,"/");
if (d[1] > 2021) {
if (p['$i1'] == "") for (i = '$i1'; i < '$i2'; i++)
	{ if ('$1' < 2) p[i] = $i; else p[i] = $i + $(i+10) }
else {
printf "%s/%s",d[2],d[3];
x = z = 0;
for (i = '$i1'; i < '$i2'; i++) {
  if ('$1' < 2) { y[i] = $i - p[i]; if (y[i] < 0) y[i] = 0; p[i] = $i; }
  else { y[i] = $i + $(i+10) - p[i]; if (y[i] < 0) y[i] = 0; p[i] = $i + $(i+10); }
}
for (i = '$i1'; i < '$i2'; i++) printf ",%s", (x += y[i]);
if (x == 0) x = 1;
for (i = '$i1'; i < '$i2'; i++) printf ",%.2f", (z += y[i]) / x * 100;
for (i = '$i1'; i < '$i2'; i++) printf ",%s", y[i];
for (i = '$i1'; i < '$i2'; i++) printf ",%.2f", y[i] / x * 100;
print ""}}}' $src > $dst
local nskp=`awk 'END{print int((NR-1)/11)+1}' $dst`
xmarks=`awk -F, '(NR-2)%'$nskp' == '$((nskp/2))'{printf "\"%s\" %d,",$1,NR-2}' $dst`
local pn=${prefNames[$(($1+1))]}
mkPlot cum 2 人 $pn > ages_num_c/$1.svg
mkPlot cum 12 % $pn > ages_rate_c/$1.svg
mkPlot raw 22 人 $pn > ages_num_r/$1.svg
mkPlot raw 32 % $pn > ages_rate_r/$1.svg
}
#
for d in ages_{num,rate}_{c,r}
do if [ ! -d $d ]; then mkdir $d; fi 
done
for i in 0 1 2
do makeGraphs $i
done
#
dtm () {
	LANG=ja_JP ls -lT $1 | awk '{printf "%d/%02d/%02d@%s\n",$9,$6,$7,$8}'
}
awk 'BEGIN{dt["Revision"]="'`date "+%Y/%m/%d@%H:%M:%S"`'";
dt["AgeZones"]="'`dtm $src`'"}
{if(NF>=4 && dt[$4] != ""){split(dt[$4],a,"@");$1=a[1];$2=a[2]}print}' index.html > tmp.html
mv -f tmp.html index.html
logEnd
