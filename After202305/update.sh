#! /bin/zsh
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start
if [ ! -f script.js ]
  then cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
fi
year=`date +%Y`; week=$(((`date +%j`-9)/7))
if [ $week -le 0 ]
  then year=$(($year-1))
  if [ $(($year%4)) -eq 0 ]; then yd=366; else yd=365; fi
  week=$(((`date +%j`-9+$yd)/7))
fi
if [ $week -le 9 ]; then week=0$week; fi
tmpf=/tmp/getFile_$$
host=www.niid.go.jp
dataURL=https://$host/niid/images/idwr/sokuho/idwr-$year/$year$week/$year-$week-teiten-tougai.csv
curl -s -S $dataURL > $tmpf
if [ $? -ne 0 ]; then echo "Could not get remote data ($?)."
else /usr/local/bin/nkf -w -d $tmpf | awk -F, 'NR==2{print "const dataInfo = \"" $1 "\""}
/^COVID-19,/{r=NR+2;print "const data = {"}
r>0 && NR>r{printf "\"%s\":",(NR==r+1)?"全国":$1;
  for(i=5;i<=NF;i+=2)printf "%s%s",(i==5)?"[":",",$i;print "],"}
END{print "}"}' > $year.js
fi
rm -rf $tmpf
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
