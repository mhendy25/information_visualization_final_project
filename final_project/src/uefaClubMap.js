import React, { useEffect, useRef } from "react";
import * as d3 from 'd3';
import { geoPath, geoMercator } from "d3-geo";
import { geoBounds, geoContains, forceSimulation, forceManyBody, forceCenter, forceCollide, select, quadtree } from "d3";
import { Routes } from './routes'
// import villarrealLogo from './top_5_football_leagues/la-liga/villarreal.png';



// some fancy cody to try to prevent point overlapping that does not work - I just keep it here
function customCollisionDetection(nodes, padding) {
    const quadtree = d3.quadtree()
      .x(d => d.x)
      .y(d => d.y)
      .addAll(nodes);
  
    return function (d) {
      const r = d.radius + padding;
      const nx1 = d.x - r;
      const nx2 = d.x + r;
      const ny1 = d.y - r;
      const ny2 = d.y + r;
  
      quadtree.visit((quad, x1, y1, x2, y2) => {
        if (!quad.length) {
          do {
            const node = quad.data;
            const r = node.radius + d.radius + padding;
            const x = node.x - d.x;
            const y = node.y - d.y;
            const l = Math.sqrt(x * x + y * y);
  
            if (l < r) {
              l = (l - r) / l * 0.5;
              d.x -= x *= l;
              d.y -= y *= l;
              node.x += x;
              node.y += y;
            }
          } while (quad = quad.next);
        }
  
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }


// function that outputs map with club logos
function ClubMap(props){
    const {width, height, map, clubs, logos} = props;

    // console.log(logos);

    // console.log(Object.keys(clubs).length);

    // Define a geoMercator projection
    let projection = geoMercator();
    projection.scale(545)
            .translate([235, height + 300]);
    let path = geoPath().projection(projection);

    const svgRef = useRef(); // helps to dynamically update svg I think
    const randomPoints = [];

    useEffect(() => {

        // Create SVG container
        const svg = select(svgRef.current)
        .attr('id', "check") // just for reference when inspecting elements
        .attr('width', width)
        .attr('height', height);


        for (const [i, value] of Object.entries(clubs)) {
            const targetFeature = map["features"].find( // find the borders of country i
            feature =>
                feature.properties && feature["properties"]["NAME"].includes(i)
            );

            if (targetFeature) {
                // console.log(targetFeature["properties"]["NAME"]);
                // const country = targetFeature["properties"]["NAME"];
                const bounds = geoBounds(targetFeature["geometry"]); // the borders of country i
                // console.log(targetFeature["geometry"]);
                

                for (let j = 0; j < value.length; j++) { // generate a point for each club in country i
                    let randomPoint;
                    let isValidPoint = false;

                    const targetClub = logos.find( // remove accents, dashes, funny letters, and use lowercase
                        club =>
                            club["File Name"].includes(value[j]
                                .replace(/-/g, ' ').normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "").toLowerCase()) || 
                                value[j].replace(/-/g, ' ').
                                normalize("NFD").replace(/[\u0300-\u036f]/g, "").
                                toLowerCase().includes(club["File Name"])
                        );

                    // if (targetClub){
                    //     console.log(targetClub);
                    // } else{
                    //     console.log(value[j].replace(/-/g, ' ').
                    //     normalize("NFD").replace(/[\u0300-\u036f]/g, "").
                    //     toLowerCase());
                    // }
                    
                    
                    // Try generating a valid point within the country borders
                    while (!isValidPoint) {
                        randomPoint = {
                            type: 'Point',
                            coordinates: [
                            Math.random() * (bounds[1][0] - bounds[0][0]) + bounds[0][0],
                            Math.random() * (bounds[1][1] - bounds[0][1]) + bounds[0][1],
                            ],
                            club: value[j],
                            country: i,
                            logo: targetClub ? targetClub["File Path"] : null
                            
                        };

                        // Check if the point is within the country borders
                        if (geoContains(targetFeature["geometry"], randomPoint.coordinates)) {
                            isValidPoint = true;
                        }
                    }

                    // Convert geographic coordinates to screen coordinates using the projection
                    const screenCoordinates = projection(randomPoint.coordinates);
                    randomPoint.screenCoordinates = screenCoordinates;

                    randomPoints.push(randomPoint);
                }

            }

            
        }

        // console.log(randomPoints); // if you want to see what these points look like


        const importPromises = randomPoints.map(d => { // gives us time to import the logo before we display map

            // Check if the 'logo' property exists before attempting to import
            if (d.logo) {
              return import(`./${d.logo}`)
                .then(module => module.default)
                .catch(error => {
                  console.error(`Error loading image for ${d.logo}:`, error);
                  return null; // or provide a fallback image path
                });
            } else {
              return Promise.resolve(null); // or provide a fallback image path (not complete, need to select adequate image)
            }
          });


        // the force supposedly keeping the points spread appart 
        // sorry for sassy comment, the problem is that the space is too small to prevent overlap
        // better with than without
        const simulation = forceSimulation()
            .force('charge', forceManyBody().strength(-20))
            .force('collide', forceCollide().radius(3).strength(0.7))
            .force('center', forceCenter(width / 2, height / 2));
            

        simulation.nodes(randomPoints)
            .on('tick', () => {

                Promise.all(importPromises).then(images => {
                    svg.selectAll('.point')
                      .data(randomPoints)
                      .enter()
                      .append('image')
                      .attr('class', 'point')
                      .attr('x', d => d.screenCoordinates[0])
                      .attr('y', d => d.screenCoordinates[1])
                      .attr('width', 15)
                      .attr('height', 15)
                      .attr('country', d => d.country)
                      .attr('club', d => d.club)
                      .attr('xlink:href', (d, i) => (d.logo ? images[i] : null)) // the logo is added here after import
                      .each(customCollisionDetection(randomPoints, 5)); // prevents collision heh?
                  });
            })

    }, [randomPoints, width, height] ) // needed for updating display if any of these items changes 


    return <g>
        {
            map.features.map(d => <path key={d.properties.name} d={path(d)} // the map of Europe
            stroke={"white"} fill={"#0c194b"}></path>)
        }
        {   
            // selectedCountries.map(
            //     d => <circle cx={projection([d.longitude, d.latitude])[0]  }
            //         cy={projection([d.longitude, d.latitude])[1] + Math.floor(Math.random() * 5) } 
            //         r={2} fill={"#2a5599"} id={"point"}></circle>
            // )
            <svg ref={svgRef} /> // the very dynamic svg with all the logos
        }

    </g>

}

export { ClubMap }