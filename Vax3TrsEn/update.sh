#! /bin/zsh
# zsh script to revise and translate the statistic data of COVID-19 in Japan.
# by Tatsuo Unemi, Soka University, Nov. 2022.
comName=`echo $0 | awk -F/ 'BEGIN{OFS="/"}{if(NF>1)print $(NF-1),$NF;else print $NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $comName start
dir=`echo $0 | awk -F/ 'BEGIN{OFS="/"}{$NF="";print}'`
vSrc=prefecture.ndjson
pSrc=confirmed_cases_cumulative_daily.csv
vData=vaxPref.js
pData=ptnPref.js
if [ -d "$dir" ]; then cd $dir; fi
if [ ! -f ./getFileIfNew.sh ]; then echo "Couldn't find getFileIfNew.sh."; exit 0; fi 
./getFileIfNew.sh https://data.vrs.digital.go.jp/vaccination/opendata/latest/$vSrc
./getFileIfNew.sh https://covid19.mhlw.go.jp/public/opendata/$pSrc
note='// This file was created automatically by "updete.sh."
// Please don'\''t edit the content manually.
// by Tatsuo Unemi, Soka University, Nov. 2022.'
if [ ! -f $vData -o $vData -ot $vSrc ]
then echo $note > $vData
awk -F: 'function out() {
  if (dt == "") return;
  split(dt,a,"-");
  printf "%s\n[\"%d/%d/%d\"", cc,a[1],a[2],a[3];
  for (i = 1; i <= 47; i ++) printf ",%d", p[i];
  printf "]"; cc = ","
}
BEGIN{printf "vaxTbl = "; cc = "["}
/,"status":3,/{
split($2,a,"\"");cdt=a[2];
split($3,a,"\"");cpr=int(a[2]);
cn=int($NF);
if (cdt != dt) { out(); dt = cdt }
p[cpr] += cn }
END{ out(); print "];" }' $vSrc >> $vData; fi
if [ ! -f $pdata -o $pData -ot $pSrc ]
then echo $note > $pData
awk -F, 'BEGIN{printf "ptnTbl = "; cc = "["}
/2021\/12\/1/{a=1}a==1{printf "%s\n[\"%s\"", cc, $1;
for (i = 2; i <= NF; i ++) printf ",%d", $i;
printf "]"; cc = ","}
END{print "];"}' $pSrc >> $pData; fi
echo --- `date "+%Y/%m/%d %H:%M:%S"` $comName end
