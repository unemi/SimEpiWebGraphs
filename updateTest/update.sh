#! /bin/bash
# Dependencies: getFileIfNew.sh nhk_pref.sh nhk_plot.sh
#		tky_ages.sh tky_patients.sh tky_tests.sh
echo --- `date "+%Y/%m/%d %H:%M:%S"` $0 start 
if [ ! -f nhk_pref.sh ]
then cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
fi
if [ `echo $PATH | fgrep -q local; echo $?` -ne 0 ]
then PATH=/usr/local/bin:$PATH
fi
echo "nhk_pref"; ./nhk_pref.sh
echo "tky_ages"; ./tky_ages.sh
echo "tky_patients"; ./tky_patients.sh
echo "tky_tests"; ./tky_tests.sh
#
dtm () {
	LANG=ja_JP ls -lT $1 | awk '{printf "%d/%02d/%02d@%s\n",$9,$6,$7,$8}'
}
awk 'BEGIN{dt["Revision"]="'`date "+%Y/%m/%d@%H:%M:%S"`'";
dt["Prefectures"]="'`dtm nhk_news_covid19_prefectures_daily_data.csv`'";
dt["Ages"] = "'`dtm 130001_tokyo_covid19_patients_2022-1.csv`'";
dt["Patients"] = "'`dtm 130001_tokyo_covid19_details_testing_positive_cases.csv`'";
dt["Tests"] = "'`dtm 130001_tokyo_covid19_positivity_rate_in_testing.csv`'"}
{if(NF>=4 && dt[$4] != ""){split(dt[$4],a,"@");$1=a[1];$2=a[2]}print}' index.html > tmp.html
mv -f tmp.html index.html
echo --- `date "+%Y/%m/%d %H:%M:%S"` $0 end 
