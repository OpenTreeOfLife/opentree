#!/bin/sh
set -x
if ! test -d ncl
then
    git clone https://github.com/mtholder/ncl.git || exit
    cd ncl || exit 
    sh bootstrap.sh || exit
    cd ../build-ncl-static || exit
    ../ncl/configure --enable-static --disable-shared --prefix="${NCL_INSTALL_DIR}" --with-constfuncs=yes || exit
    cd ..
else
    cd ncl || exit
    git pull origin master || exit
    cd ..
fi

export NCL_INSTALL_DIR="${PWD}/private"
if ! test -d build-ncl-static
then
    mkdir build-ncl-static || exit
fi
cd build-ncl-static || exit
make -j2 || exit
#make check || exit
make install || exit
#make installcheck || exit
cd ..

# If the config file does not appear to have been configured for 
# the NCLconverter tool, add the relevant settings...
if ! grep '^\[external\]' private/config > /dev/null
then
    echo '[external]' >> private/config
    echo "dir=${NCL_INSTALL_DIR}/scratch" >> private/config
    echo "2nexml=${NCL_INSTALL_DIR}/bin/NCLconverter" >> private/config
fi
