date=`date +%Y%m%d%H%M`; sed -e "s/const BXE_BUILD = .*/const BXE_BUILD = \"$date\"/" bxeLoader.js > bxeLoader.js.new ; mv bxeLoader.js.new bxeLoader.js
