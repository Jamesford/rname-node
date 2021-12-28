import axios from "axios";
import prompts from "prompts";
import { getConfig } from "../lib/config.js";

export async function getShowByID(tv_id) {
  const { apiKey } = await getConfig();
  const {
    data: { id, name, overview },
  } = await axios({
    method: "get",
    url: `https://api.themoviedb.org/3/tv/${tv_id}`,
    params: {
      api_key: apiKey,
      language: "en-US",
    },
  });
  return { id, name, overview };
}

export async function getShowByQuery(query) {
  const { apiKey } = await getConfig();
  if (query === "") throw new Error("Empty show search query");

  const {
    data: { results, total_results },
  } = await axios({
    method: "get",
    url: "https://api.themoviedb.org/3/search/tv",
    params: {
      api_key: apiKey,
      language: "en-US",
      include_adult: true,
      page: 1,
      query: query,
    },
  });

  if (total_results === 0) {
    console.log(`No results for "${query}"`);
    return getShowByQuery(query.split(" ").slice(0, -1).join(" "));
  }

  const shows = results.map((r) => ({
    id: r.id,
    name: r.name,
    overview: r.overview,
  }));

  if (total_results === 1) return shows[0];

  const { value } = await prompts({
    type: "select",
    name: "value",
    message: "Multiple results found",
    choices: shows.map((show, i) => ({
      title: show.name,
      description: show.overview,
      value: i,
    })),
    initial: 0,
  });

  return shows[value];
}

export async function getEpisodeTitles(id, season) {
  const { apiKey } = await getConfig();
  const { data } = await axios({
    method: "get",
    url: `https://api.themoviedb.org/3/tv/${id}/season/${season}`,
    params: {
      api_key: apiKey,
      language: "en-US",
    },
  });

  return data.episodes.reduce(
    (acc, v) => ({ ...acc, [v.episode_number]: v.name }),
    {}
  );
}
