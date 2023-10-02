#! /bin/zsh
progName=`echo $0 | awk -F/ '{OFS="/";print $(NF-1),$NF}'`
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName start
if [ ! -f script.js ]
  then cd `echo $0 | awk -F/ '{OFS="/";$NF="";print}'`
fi
year=`date +%Y`; week=$(((`date +%j`-5)/7))
if [ $week -le 0 ]; then year=$(($year-1)); fi
host=https://www.mhlw.go.jp
topPage=/stf/seisakunitsuite/bunya/0000121431_00438.html
tmpTop=/tmp/mhlwTop.html
tmpjs=/tmp/mhlwYear.js
curl -s $host$topPage > $tmpTop
if [ $? -ne 0 ]; then echo "Could not get the top page."; exit; fi
pdfPage=`awk '/content.*pdf/{for(i=1;i<=NF;i++)if($i~/href=/){split($i,a,"\"");print a[2];exit}}' $tmpTop`
if [ -z $pdfPage ]; then echo "Could not find PDF link."; exit; fi
pdfName=`echo $pdfPage | awk -F/ '{print $NF}'`
if [ -f $pdfName ]; then echo "Data PDF $pdfName already exists."; exit; fi
curl -s $host$pdfPage > $pdfName
if [ $? -ne 0 ]; then echo "Could not get $pdfPage."; exit; fi
pdftotext -f 2 -l 2 -layout $pdfName pdfPage.txt
# check text
if awk 'NF>3{n++}END{exit n==48}' pdfPage.txt; then echo "PDF data was in a different form."; exit; fi 
awk 'NR==FNR && /'$year'/{printf "const dataInfo = \"%s\"\nconst byMHLW = true, data = {\n",$1;n=0}
NR==FNR && NF>3{n++; x[n]=$NF}
/const data = /{i=0}
/^\".*\],$/{print substr($0,1,length($0)-2) "," x[(i==0)?n:i] "],";i++}
END{print "}"}' pdfPage.txt $year.js > $tmpjs
if [ $? -ne 0 ]; then echo "Could not remake data."; exit; fi
mv $tmpjs $year.js
# rm -rf $tmpTop
echo --- `date "+%Y/%m/%d %H:%M:%S"` $progName end
