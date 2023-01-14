#! /bin/bash
if [ ! -f nhk_plot.sh ]
then cd /Users/unemi/Research/SimEpidemicPJ/内閣府PJ/統計データ
fi
fnm=nhk_news_covid19_prefectures_daily_data.csv
./getFileIfNew.sh https://www3.nhk.or.jp/n-data/opendata/coronavirus/$fnm
if [ $? -ne 0 ]; then exit; fi
if [ ! -d nhk_pref ]; then mkdir nhk_pref; fi
cd nhk_pref
if [ -f 01*.csv ]; then rm [0-9][0-9]*.csv; fi
awk -F, 'NR>1{if($2!=pn){if(fn!="")close(fn);pn=$2;fn=$2 $3 ".csv";nn=1}\
 printf "%d\t%s\t%s\n",nn,$4,$1 > fn; nn++}' ../$fnm
cd ..
if [ ! -d nhk_pref_weekly ]; then mkdir nhk_pref_weekly; fi
cd nhk_pref_weekly
if [ -f 01*.csv ]; then rm [0-9][0-9]*.csv; fi
awk -F, 'NR>1{if($2!=pn){if(fn!="")close(fn);pn=$2;fn=$2 $3 ".csv";n=0;s=0;idx=0;nn=0}\
 if(n<7){n++;s+=$4}else s+=$4-v[idx];v[idx]=$4;idx=(idx+1)%7;\
 printf "%d\t%.4f\t%s\n",nn,s/n,$1 > fn; nn++}' ../$fnm
echo "Prefectural data were renewed."
cd ..
./nhk_plot.sh 20
