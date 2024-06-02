// src/components/Dashboard.js

import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [alertCategoryCount, setAlertCategoryCount] = useState([]);
  const [alertsOverTime, setAlertsOverTime] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/eve.json', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const lines = response.data.split('\n').filter(line => line.trim() !== '');
        const data = [];
        
        for (let line of lines) {
          try {
            data.push(JSON.parse(line));
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }

        console.log('Data fetched:', data);

        // Transform Data
        const alertCategoryCount = data.reduce((acc, curr) => {
          if (curr.alert && curr.alert.category) {
            acc[curr.alert.category] = (acc[curr.alert.category] || 0) + 1;
          }
          return acc;
        }, {});

        const alertsOverTime = data.reduce((acc, curr) => {
          if (curr.timestamp) {
            const timestamp = new Date(curr.timestamp).toISOString().slice(0, 16);
            acc[timestamp] = (acc[timestamp] || 0) + 1;
          }
          return acc;
        }, {});

        const heatmapData = data.reduce((acc, curr) => {
          if (curr.src_ip && curr.dest_port) {
            const key = `${curr.src_ip}-${curr.dest_port}`;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        }, {});

        setAlertCategoryCount(Object.entries(alertCategoryCount));
        setAlertsOverTime(Object.entries(alertsOverTime).map(([timestamp, count]) => ({ timestamp, count })));
        setHeatmapData(Object.entries(heatmapData).map(([key, count]) => {
          const [src_ip, dest_port] = key.split('-');
          return { src_ip, dest_port, count };
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h1>Network Alert Dashboard</h1>
      <div className="plot-container">
        <Plot
          data={[{
            x: alertCategoryCount.map(([category]) => category),
            y: alertCategoryCount.map(([, count]) => count),
            type: 'bar',
            marker: { 
              color: alertCategoryCount.map(() => `hsl(${Math.random() * 360}, 100%, 50%)`),
              line: { color: 'rgb(255, 255, 255)', width: 1.5 }
            },
          }]}
          layout={{ 
            title: 'Alert Count by Category',
            plot_bgcolor: '#222',
            paper_bgcolor: '#222',
            font: { color: '#fff' },
            titlefont: { color: '#fff', size: 24 },
            xaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Category', font: { color: '#fff' } } },
            yaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Count', font: { color: '#fff' } } }
          }}
        />
        <Plot
          data={[{
            x: alertsOverTime.map(({ timestamp }) => timestamp),
            y: alertsOverTime.map(({ count }) => count),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'rgb(204,204,255)', size: 8 },
            line: { color: 'rgb(51,102,204)', width: 2 },
          }]}
          layout={{ 
            title: 'Alerts Over Time',
            plot_bgcolor: '#222',
            paper_bgcolor: '#222',
            font: { color: '#fff' },
            titlefont: { color: '#fff', size: 24 },
            xaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Timestamp', font: { color: '#fff' } } },
            yaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Count', font: { color: '#fff' } } }
          }}
        />
        <Plot
          data={[{
            x: heatmapData.map(({ src_ip }) => src_ip),
            y: heatmapData.map(({ dest_port }) => dest_port),
            z: heatmapData.map(({ count }) => count),
            type: 'heatmap',
            colorscale: 'Rainbow',
          }]}
          layout={{ 
            title: 'Heatmap of Source IP vs. Destination Port',
            plot_bgcolor: '#222',
            paper_bgcolor: '#222',
            font: { color: '#fff' },
            titlefont: { color: '#fff', size: 24 },
            xaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Source IP', font: { color: '#fff' } } },
            yaxis: { tickfont: { color: '#fff', size: 14 }, title: { text: 'Destination Port', font: { color: '#fff' } } }
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
