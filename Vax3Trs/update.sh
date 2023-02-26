#! /bin/zsh
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start 
dir=/Users/admin/SimEpidemic/DocumentRoot/unemi/Vax3Trs
vSrc=prefecture.ndjson
pSrc=confirmed_cases_cumulative_daily.csv
vData=data/vax_pref.csv
pData=data/ptn_pref.csv
if [ -d $dir ]; then cd $dir; fi
if [ ! -f ../updateTest/getFileIfNew.sh ]; then exit 0; fi 
../updateTest/getFileIfNew.sh https://data.vrs.digital.go.jp/vaccination/opendata/latest/$vSrc
../updateTest/getFileIfNew.sh https://covid19.mhlw.go.jp/public/opendata/$pSrc
if [ ! -f $vData -o $vData -ot $vSrc ]
then awk -F: 'function out() {
  if (dt == "") return;
  split(dt,a,"-");
  printf "%d/%d/%d", a[1],a[2],a[3];
  for (i = 1; i <= 47; i ++) printf ",%d", p[i];
  print ""
}
/,"status":3,/{
split($2,a,"\"");cdt=a[2];
split($3,a,"\"");cpr=int(a[2]);
cn=int($NF);
if (cdt != dt) { out(); dt = cdt }
p[cpr] += cn }
END{ out() }' $vSrc > $vData
vDataN=../COVID19JpnTPp5/data/vax.csv
awk -F, 'function out() {
  if (dt == "") return;
  split(dt,a,"-");
  printf "%d/%d/%d", a[1],a[2],a[3];
  for (i = 1; i < 6; i ++) printf ",%d", p[i];
  print "" }
{ split($1,a,"\"");cdt=a[4];
split($7,a,":");ctm=int(a[2]);
if (cdt != dt) { out(); dt = cdt }
split($NF,a,":"); p[ctm] += int(a[2]) }
END{ out() }' $vSrc > $vDataN
fi
if [ ! -f $pdata -o $pData -ot $pSrc ]
then awk '/2021\/12\/1/{a=1}a==1{print}' $pSrc > $pData; fi
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
