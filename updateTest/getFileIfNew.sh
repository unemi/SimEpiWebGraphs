#! /bin/bash
if [ -z "$1" ]; then echo "usage: $0 <URL>"; exit 1; fi
LANG=C
if [[ $1 != http://[0-9A-Za-z]* && $1 != https://[0-9A-Za-z]* ]]
then echo "URL must start with http:// or https://."; exit; fi 
host=`echo $1 | cut -d/ -f3`
fnm=`echo $1 | awk -F/ '{split($NF,a,"?");print a[1]}'`
if [ -z "$host" -o -z "$fnm" ]; then echo "Invalid URL form $1."; exit 2; fi
tmpf=/tmp/getFile_$$
curl -s -S -I $1 > $tmpf
if [ $? -ne 0 ]; then echo "Could not access $host ($?)."; rm -rf $tmpf; exit 3; fi
retCode=`head -1 $tmpf | cut -d\  -f2`
if [ "$retCode" -ne 200 ]; then echo "HTTP error from $host ($retCode)."
  rm -rf $tmpf; exit 4; fi
mdatex=`awk 'BEGIN{IGNORECASE=1;a=""}/^last-modified:/{a=$0}/^date:/{if(a=="")a=$0}\
END{split(a,b," ");print b[3],b[4],b[5],b[6],substr(b[7],1,3)}' $tmpf`
rm -f $tmpf
if [ -z "$mdatex" ]; then echo "Could not get the time information from $host."; exit 5; fi
mdate=`date -j -f "%d %b %Y %T %Z" "$mdatex" +%s`
echo "Remote: `date -j -f %s $mdate +%+`"
if [ -f $fnm ]; then cdatex=`ls -lT $fnm | awk '{print $6,$7,$8,$9}'`
cdate=`date -j -f "%b %d %T %Y" "$cdatex" +%s`
echo "Local : `date -j -f %s $cdate +%+`"
if [ $mdate -le $cdate ]; then echo "Remote data has not been renewed yet."; exit 6; fi
fi
curl -s -S $1 > $tmpf
if [ $? -ne 0 ]; then echo "Could not get remote data ($?)."; rm -rf $tmpf; exit 7; fi
mv -f $tmpf $fnm
touch -t `date -j -f %s $mdate +%Y%m%d%H%M.%S` $fnm
exit 0
