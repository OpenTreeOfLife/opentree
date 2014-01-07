#!/bin/sh
set -x
git clone https://github.com/mtholder/ncl.git || exit
export NCL_INSTALL_DIR="${PWD}/private"
if ! test -d build-ncl-static
then
    mkdir build-ncl-static || exit
fi
cd ncl/ || exit
sh bootstrap.sh || exit
cd ../build-ncl-static || exit
../ncl/configure --enable-static --disable-shared --prefix="${NCL_INSTALL_DIR}" --with-constfuncs=yes || exit
make -j2 || exit
make check || exit
make install || exit
make installcheck || exit

echo '[external]' >> private/config
echo "dir=${NCL_INSTALL_DIR}/private/scratch" >> private/config
echo "2nexml=${NCL_INSTALL_DIR}/bin/NCLconverter" >> private/config