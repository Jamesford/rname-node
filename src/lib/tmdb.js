import axios from "axios";
import prompts from "prompts";
import { getConfig } from "../lib/config.js";

export async function getMovieByID(movie_id) {
  const { apiKey } = await getConfig();
  const {
    data: { id, title, overview, release_date },
  } = await axios({
    method: "get",
    url: `https://api.themoviedb.org/3/movie/${movie_id}`,
    params: {
      api_key: apiKey,
      language: "en-US",
    },
  });
  return { id, title, overview, year: release_date.substring(0, 4) };
}

export async function getMovieByQuery(query) {
  const { apiKey } = await getConfig();
  if (query === "") throw new Error("Empty movie search query");

  const regex = RegExp(/y:(\d{4})/i);
  let search = { query };
  if (regex.test(query)) {
    const [_, year] = query.match(regex);
    search = {
      query: query.replace(regex, "").trim(),
      year,
    };
  }

  const {
    data: { results, total_results },
  } = await axios({
    method: "get",
    url: "https://api.themoviedb.org/3/search/movie",
    params: {
      api_key: apiKey,
      language: "en-US",
      include_adult: true,
      page: 1,
      ...search,
    },
  });

  if (total_results === 0) {
    console.log(`No results for "${query}"`);
    return getMovieByQuery(query.split(" ").slice(0, -1).join(" "));
  }

  const movies = results.map((r) => ({
    id: r.id,
    title: r.title,
    overview: r.overview,
    year: r.release_date.substring(0, 4),
  }));

  if (total_results === 1) return movies[0];

  const { value } = await prompts({
    type: "select",
    name: "value",
    message: "Multiple results found",
    choices: movies.map((movie, i) => ({
      title: `${movie.title} (${movie.year})`,
      description: movie.overview,
      value: i,
    })),
    initial: 0,
  });

  return movies[value];
}

export async function getShowByID(tv_id) {
  const { apiKey } = await getConfig();
  const {
    data: { id, name, overview, first_air_date },
  } = await axios({
    method: "get",
    url: `https://api.themoviedb.org/3/tv/${tv_id}`,
    params: {
      api_key: apiKey,
      language: "en-US",
    },
  });
  return { id, name, overview, year: first_air_date.substring(0, 4) };
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
    year: r.first_air_date.substring(0, 4),
  }));

  if (total_results === 1) return shows[0];

  const { value } = await prompts({
    type: "select",
    name: "value",
    message: "Multiple results found",
    choices: shows.map((show, i) => ({
      title: `${show.name} (${show.year})`,
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
