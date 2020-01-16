/*
 *  Copyright (C) 2019  Attila Aldemir <a_aldemir@hotmail.de>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const config = {
    test: {
        attestationModule: {
            runTests: true,
            runNodeDependentTests: false
        },
        dataModule: {
            runTests: true
        },
        entityModule: {
            runTests: true
        }
    },
    node: {
        url: {
            testnet: 'https://testardor.jelurida.com',
            mainnet: 'https://ardor.jelurida.com'
        }
    },
    account: {
        alice: {
            address: 'ARDOR-S27P-EHWT-8D2L-937R7',
            secret: 'wash old rain spice ordinary frame mansion dance heavy below slight illness'
        },
        bob: {
            address: 'ARDOR-YQ26-W5RK-6ATW-G9HRT',
            secret: 'people sock unveil trash master enroll jar marine poem index frost next'
        },
        charlie: {
            address: 'ARDOR-A5ZZ-S43Z-45W6-DCLYB',
            secret: 'desperate party awkward choose more attempt belief fish just echo grey yet'
        },
        david: {
            address: 'ARDOR-DN2R-M98S-KHN4-8ASUT',
            secret: 'naked thread reason wonder open wife princess least crowd lick nightmare trouble'
        },
        erin: {
            address: 'ARDOR-3U2L-ZZJ2-MFT8-AVR3J',
            secret: 'grew void simple flirt actually depress leg sick coward garden pride comfort'
        },
        frank: {
            address: 'ARDOR-568B-CVYX-LQUN-GT6KG',
            secret: 'somehow haunt memory forever pull mouth stage sink depress couch desperate waste'
        }
    }
};


export default config;