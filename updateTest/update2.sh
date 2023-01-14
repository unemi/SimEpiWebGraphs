#! /bin/bash
# Dependencies: getFileIfNew.sh mhlw_pref.sh
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start 
if [ ! -f mhlw_pref.sh ]
then cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
fi
if (echo $PATH | fgrep -q local)
then dummy=""; else PATH=/usr/local/bin:$PATH
fi
echo "mhlw_pref"; ./mhlw_pref.sh
# echo "nhk_pref"; ./nhk_pref.sh
# echo "tky_ages"; ./tky_ages.sh
# echo "tky_patients"; ./tky_patients.sh
# echo "tky_tests"; ./tky_tests.sh
#
dtm () {
	LANG=ja_JP ls -lT $1 | awk '{printf "%d/%02d/%02d@%s\n",$9,$6,$7,$8}'
}
awk 'BEGIN{dt["Revision"]="'`date "+%Y/%m/%d@%H:%M:%S"`'";
dt["Prefectures"]="'`dtm newly_confirmed_cases_daily.csv`'"}
{if(NF>=4 && dt[$4] != ""){split(dt[$4],a,"@");$1=a[1];$2=a[2]}print}' index.html > tmp.html
mv -f tmp.html index.html
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
