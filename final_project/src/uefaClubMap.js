import React from "react";
import { geoPath, geoMercator } from "d3-geo";
import { Routes } from './routes'

var step = 10;

function ClubMap(props){
    const {width, height, countries, selectedCountries} = props;
    let projection = geoMercator();//TODO: Create a projection of type Mercator.
    projection.scale(545)
            .translate([width / 2, height + 300]);
    let path = geoPath().projection(projection);

    return <g>
        {
            countries.features.map(d => <path key={d.properties.name} d={path(d)} 
            stroke={"#ccc"} fill={"#eee"}></path>)
        }
        {   
            selectedCountries.map(
                d => <circle cx={projection([d.longitude, d.latitude])[0]  }
                    cy={projection([d.longitude, d.latitude])[1] + Math.floor(Math.random() * 5) } r={2} fill={"#2a5599"}></circle>
            )
        }

    </g>

}

export { ClubMap }