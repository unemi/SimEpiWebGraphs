#! /bin/zsh
# Weekly data of newly confirmed cases
cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start
logEnd() {
	echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
}
if (echo $PATH | fgrep -q local)
then dummy=""; else PATH=/usr/local/bin:$PATH
fi
src=newly_confirmed_cases_detail_weekly.csv
dst=ages.csv
../updateTest/getFileIfNew.sh https://covid19.mhlw.go.jp/public/opendata/$src
if [ $? -ne 0 ]; then logEnd; exit; fi
prefNames=("全国" "北海道" 
"青森県" "岩手県" "宮城県" "秋田県" "山形県" "福島県"
"茨城県" "栃木県" "群馬県" "埼玉県" "千葉県" "東京都" "神奈川県"
"新潟県" "富山県" "石川県" "福井県" "山梨県" "長野県" "岐阜県" "静岡県" "愛知県"
"三重県" "滋賀県" "京都府" "大阪府" "兵庫県" "奈良県" "和歌山県"
"鳥取県" "島根県" "岡山県" "広島県" "山口県"
"徳島県" "香川県" "愛媛県" "高知県"
"福岡県" "佐賀県" "長崎県" "熊本県" "大分県" "宮崎県" "鹿児島県"
"沖縄県")
#
mkPlot() {
if [ "$1" = "cum" ]; then CM=fc; else CM="lw 2 lc"; fi
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
set xlabel "$4 新規陽性患者数年代別 週間報告数推移"
set xtics ($xmarks)
cl(x) = (x < .5)? x * 2. / 3. : (x < 5. / 8.)? x * 8. / 3. - 1. : x * 2. / 3. + 1. / 4
plot for [i = $(($2+9)):$2:-1] 'ages.csv' using 0:i $CM rgb hsv2rgb(cl((i-$2)/10.),CS,CV)
EOF
}
makeGraphs() {
local i1=$(($1*10+2))
local i2=$((i1+10))
awk -F, 'BEGIN{ttl=",10歳未満,10代,20代,30代,40代,50代,60代,70代,80代,90歳以上";
printf "日付%s%s%s%s\n", ttl, ttl, ttl, ttl}
$1 ~ /~/{split($1,dx,"~");split(dx[1],d,"/");printf "%s/%s",d[2],d[3];
x = z = 0;
for (i = '$i1'; i < '$i2'; i++) printf ",%s", (x += $i);
for (i = '$i1'; i < '$i2'; i++) printf ",%.2f", (z += $i) / x * 100;
for (i = '$i1'; i < '$i2'; i++) printf ",%s", $i;
for (i = '$i1'; i < '$i2'; i++) printf ",%.2f", $i / x * 100;
print ""}' $src > $dst
local nskp=`awk 'END{print int((NR-1)/11)+1}' $dst`
xmarks=`awk -F, '(NR-2)%'$nskp' == '$((nskp/2))'{printf "\"%s\" %d,",$1,NR-2}' $dst`
local pn=${prefNames[$(($1+1))]}
local pd=`printf "%02d" $1`
mkPlot cum 2 人 $pn > ages_num_c/$pd.svg
mkPlot cum 12 % $pn > ages_rate_c/$pd.svg
mkPlot raw 22 人 $pn > ages_num_r/$pd.svg
mkPlot raw 32 % $pn > ages_rate_r/$pd.svg
}
#
for d in ages_{num,rate}_{c,r}
do if [ ! -d $d ]; then mkdir $d; fi 
done
for i in {0..47}
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
